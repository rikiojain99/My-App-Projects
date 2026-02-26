"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import ProductDetailsSection from "@/components/manufacturing/ProductDetailsSection";
import RawMaterialsTable, {
  type ManufacturingLookupItem,
  type ManufacturingRawInput,
} from "@/components/manufacturing/RawMaterialsTable";

type RawInput = ManufacturingRawInput;
type ItemLookup = ManufacturingLookupItem;

type MessageState =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

const createEmptyRow = (): RawInput => ({
  itemName: "",
  qtyUsed: 1,
  rate: 0,
  cost: 0,
  availableQty: undefined,
  fromStock: false,
});

const recalcRow = (row: RawInput): RawInput => {
  const qtyUsed = Number(row.qtyUsed) || 0;
  const rate = Number(row.rate) || 0;
  const cost = Number((qtyUsed * rate).toFixed(2));

  return {
    ...row,
    qtyUsed,
    rate,
    cost,
  };
};

export default function ManufacturingCreate() {
  const [productName, setProductName] = useState("");
  const [producedQty, setProducedQty] = useState(1);
  const prevProducedQty = useRef(1);
  const recipeReqRef = useRef(0);

  const [inputs, setInputs] = useState<RawInput[]>([
    createEmptyRow(),
  ]);
  const [suggestions, setSuggestions] = useState<ItemLookup[]>(
    []
  );
  const [activeRow, setActiveRow] = useState<number | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);

  const updateRow = <K extends keyof RawInput>(
    index: number,
    key: K,
    value: RawInput[K]
  ) => {
    setInputs((prev) =>
      prev.map((row, i) =>
        i === index
          ? recalcRow({
              ...row,
              [key]: value,
            })
          : row
      )
    );
  };

  const addRow = () => {
    setInputs((prev) => [...prev, createEmptyRow()]);
  };

  const removeRow = (index: number) => {
    setInputs((prev) =>
      prev.filter((_, rowIndex) => rowIndex !== index)
    );
  };

  useEffect(() => {
    if (producedQty <= 0 || prevProducedQty.current <= 0) return;

    const factor = producedQty / prevProducedQty.current;
    if (factor === 1) return;

    setInputs((prev) =>
      prev.map((row) =>
        recalcRow({
          ...row,
          qtyUsed: Number((row.qtyUsed * factor).toFixed(3)),
        })
      )
    );

    prevProducedQty.current = producedQty;
  }, [producedQty]);

  const lookupItem = async (query: string, rowIndex: number) => {
    setActiveRow(rowIndex);
    setMessage(null);

    setInputs((prev) =>
      prev.map((row, i) =>
        i === rowIndex
          ? recalcRow({
              ...row,
              itemName: query,
              fromStock: false,
              availableQty: undefined,
            })
          : row
      )
    );

    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `/api/items/lookup?q=${encodeURIComponent(query)}`
      );
      if (!res.ok) return;

      const data: ItemLookup[] = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch {
      setSuggestions([]);
    }
  };

  const selectItem = (
    rowIndex: number,
    suggestion: ItemLookup
  ) => {
    setInputs((prev) =>
      prev.map((row, i) =>
        i === rowIndex
          ? recalcRow({
              ...createEmptyRow(),
              itemName: suggestion.itemName,
              qtyUsed: 1,
              rate: Number(suggestion.rate || 0),
              availableQty: Number(
                suggestion.availableQty || 0
              ),
              fromStock: true,
            })
          : row
      )
    );

    setSuggestions([]);
    setActiveRow(null);
  };

  useEffect(() => {
    const query = productName.trim();
    if (query.length < 2) return;

    const requestId = ++recipeReqRef.current;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/manufacturing?productName=${encodeURIComponent(
            query
          )}`
        );
        if (!res.ok) return;

        const recipe = await res.json();
        if (requestId !== recipeReqRef.current) return;

        if (!recipe?.inputs || !Array.isArray(recipe.inputs)) {
          return;
        }

        const baseQty =
          Number(recipe.producedQty) > 0
            ? Number(recipe.producedQty)
            : 1;

        prevProducedQty.current = baseQty;
        setProducedQty(baseQty);
        setInputs(
          recipe.inputs.map((row: any) =>
            recalcRow({
              ...createEmptyRow(),
              itemName: String(row?.itemName || ""),
              qtyUsed:
                Number(row?.qtyUsed) > 0
                  ? Number(row.qtyUsed)
                  : 1,
              rate: Number(row?.rate || 0),
              availableQty:
                typeof row?.availableQty === "number"
                  ? row.availableQty
                  : undefined,
              fromStock: true,
            })
          )
        );
      } catch {
        // Keep manual flow if recipe load fails.
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [productName]);

  const totalCost = useMemo(
    () =>
      Math.round(
        inputs.reduce((sum, row) => sum + row.cost, 0)
      ),
    [inputs]
  );

  const hasInvalidRows = useMemo(
    () =>
      inputs.some((row) => {
        const hasName = row.itemName.trim().length > 0;
        const hasValidQty =
          Number.isFinite(row.qtyUsed) && row.qtyUsed > 0;
        const hasValidRate =
          Number.isFinite(row.rate) && row.rate > 0;
        const hasStockGap =
          row.fromStock &&
          typeof row.availableQty === "number" &&
          row.qtyUsed > row.availableQty;

        return (
          !hasName || !hasValidQty || !hasValidRate || hasStockGap
        );
      }),
    [inputs]
  );

  const canSave =
    productName.trim().length > 0 &&
    producedQty > 0 &&
    inputs.length > 0 &&
    !hasInvalidRows;

  const saveManufacturing = async () => {
    if (!canSave || saving) return;

    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        productName: productName.trim(),
        producedQty: Number(producedQty),
        inputs: inputs.map((row) => {
          const normalized = recalcRow({
            ...row,
            itemName: row.itemName.trim(),
          });

          return {
            itemName: normalized.itemName,
            qtyUsed: normalized.qtyUsed,
            rate: normalized.rate,
            cost: normalized.cost,
            fromStock: normalized.fromStock,
          };
        }),
      };

      const res = await fetch("/api/manufacturing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res
        .json()
        .catch(() => ({ error: "Failed to parse response" }));

      if (!res.ok) {
        setMessage({
          type: "error",
          text: body?.error || "Error saving manufacturing",
        });
        return;
      }

      setMessage({
        type: "success",
        text: "Manufacturing saved successfully",
      });

      setProductName("");
      setProducedQty(1);
      prevProducedQty.current = 1;
      setInputs([createEmptyRow()]);
      setSuggestions([]);
      setActiveRow(null);
    } catch {
      setMessage({
        type: "error",
        text: "Network error while saving manufacturing",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-xl font-semibold mb-6">
          Manufacturing - Create
        </h1>

        {message && (
          <p
            className={`mb-4 text-sm ${
              message.type === "success"
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}

        <ProductDetailsSection
          productName={productName}
          producedQty={producedQty}
          onProductNameChange={setProductName}
          onProducedQtyChange={setProducedQty}
          disabled={saving}
        />

        <RawMaterialsTable
          inputs={inputs}
          activeRow={activeRow}
          suggestions={suggestions}
          disabled={saving}
          onLookupItem={lookupItem}
          onSelectItem={selectItem}
          onQtyChange={(rowIndex, qty) =>
            updateRow(
              rowIndex,
              "qtyUsed",
              Number.isFinite(qty) && qty >= 0 ? qty : 0
            )
          }
          onRateChange={(rowIndex, rate) =>
            updateRow(
              rowIndex,
              "rate",
              Number.isFinite(rate) && rate >= 0 ? rate : 0
            )
          }
          onAddRow={addRow}
          onRemoveRow={removeRow}
        />

        <div className="mt-6 flex flex-col md:flex-row md:justify-between md:items-center border-t pt-4 gap-3">
          <div className="text-lg font-semibold">
            Total Cost: Rs.{totalCost}
          </div>

          <div className="w-full md:w-64">
            <Button
              type="button"
              onClick={saveManufacturing}
              disabled={!canSave || saving}
              variant={canSave ? "primary" : "secondary"}
            >
              {saving ? "Saving..." : "Save Manufacturing"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
