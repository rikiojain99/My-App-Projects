"use client";

import { useEffect, useRef, useState } from "react";

/* ================= TYPES ================= */
type RawInput = {
  itemName: string;
  qtyUsed: number;
  rate: number;
  cost: number;
  availableQty?: number;
  fromStock: boolean;
};

type ItemLookup = {
  itemName: string;
  rate: number;
  availableQty: number;
};

/* ================= HELPERS ================= */
const createEmptyRow = (): RawInput => ({
  itemName: "",
  qtyUsed: 1,
  rate: 0,
  cost: 0,
  availableQty: undefined,
  fromStock: false,
});

/* ================= PAGE ================= */
export default function ManufacturingCreate() {
  const [productName, setProductName] = useState("");
  const [producedQty, setProducedQty] = useState(1);
  const prevProducedQty = useRef(1);

  const [inputs, setInputs] = useState<RawInput[]>([createEmptyRow()]);
  const [suggestions, setSuggestions] = useState<ItemLookup[]>([]);
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  /* ================= CALC ================= */
  const recalcRow = (row: RawInput): RawInput => ({
    ...row,
    cost: Number(row.qtyUsed) * Number(row.rate),
  });

  const updateRow = <K extends keyof RawInput>(
    index: number,
    key: K,
    value: RawInput[K]
  ) => {
    const copy = [...inputs];
    copy[index] = recalcRow({
      ...copy[index],
      [key]: value,
    });
    setInputs(copy);
  };

  const addRow = () => {
    setInputs([...inputs, createEmptyRow()]);
  };

  const removeRow = (i: number) => {
    setInputs(inputs.filter((_, idx) => idx !== i));
  };

  /* ================= AUTO SCALE ================= */
  useEffect(() => {
    if (producedQty <= 0 || prevProducedQty.current <= 0) return;

    const factor = producedQty / prevProducedQty.current;
    if (factor === 1) return;

    const scaled = inputs.map((r) =>
      recalcRow({
        ...r,
        qtyUsed: Number((r.qtyUsed * factor).toFixed(3)),
      })
    );

    setInputs(scaled);
    prevProducedQty.current = producedQty;
  }, [producedQty]);

  /* ================= ITEM LOOKUP ================= */
  const lookupItem = async (q: string, row: number) => {
    updateRow(row, "itemName", q);
    setActiveRow(row);

    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`/api/items/lookup?q=${q}`);
      if (!res.ok) return;
      const data: ItemLookup[] = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch {
      setSuggestions([]);
    }
  };

  const selectItem = (row: number, item: ItemLookup) => {
    const copy = [...inputs];
    copy[row] = recalcRow({
      ...createEmptyRow(),
      itemName: item.itemName,
      qtyUsed: 1,
      rate: item.rate,
      availableQty: item.availableQty,
      fromStock: true,
    });
    setInputs(copy);
    setSuggestions([]);
    setActiveRow(null);
  };

  /* ================= PRODUCT AUTO LOAD ================= */
  useEffect(() => {
    if (productName.trim().length < 2) return;

    const loadRecipe = async () => {
      try {
        const res = await fetch(
          `/api/manufacturing/products?q=${productName}`
        );
        if (!res.ok) return;

        const names: string[] = await res.json();
        if (!Array.isArray(names) || !names.includes(productName)) return;

        const recipeRes = await fetch(
          `/api/manufacturing?productName=${productName}`
        );
        if (!recipeRes.ok) return;

        const recipe = await recipeRes.json();
        if (!recipe?.inputs) return;

        prevProducedQty.current = recipe.producedQty || 1;
        setProducedQty(recipe.producedQty || 1);

        setInputs(
          recipe.inputs.map((r: RawInput) =>
            recalcRow({
              ...createEmptyRow(),
              ...r,
            })
          )
        );
      } catch {}
    };

    loadRecipe();
  }, [productName]);

  /* ================= TOTAL ================= */


   const rawTotal = inputs.reduce((s, i) => s + i.cost, 0);
  const totalCost = Math.round(rawTotal);
  /* ================= SAVE ================= */
  const saveManufacturing = async () => {
    setSaving(true);

    const res = await fetch("/api/manufacturing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
  productName,
  producedQty,
  inputs: inputs.map((i) => ({
    ...i,
    qtyUsed: i.fromStock ? i.qtyUsed : 0, // 👈 KEY FIX
  })),
}),
    });

    setSaving(false);

    if (res.ok) {
      alert("Manufacturing saved successfully");
      setProductName("");
      setProducedQty(1);
      prevProducedQty.current = 1;
      setInputs([createEmptyRow()]);
    } else {
      const e = await res.json();
      alert(e.error || "Error saving manufacturing");
    }
  };

  const canSave =
    productName.trim() !== "" &&
    producedQty > 0 &&
    inputs.every((i) => i.itemName && i.qtyUsed > 0 && i.rate > 0);

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-xl font-semibold mb-6">
          Manufacturing – Create
        </h1>

        {/* PRODUCT */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium">Product Name</label>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Produced Qty</label>
            <input
              type="number"
              min={1}
              value={producedQty}
              onChange={(e) => setProducedQty(Number(e.target.value))}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        {/* RAW MATERIAL TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="border p-2 text-left">Raw Item</th>
                <th className="border p-2">Qty</th>
                <th className="border p-2">Rate</th>
                <th className="border p-2">Cost</th>
                <th className="border p-2"></th>
              </tr>
            </thead>
            <tbody>
              {inputs.map((r, i) => (
                <tr key={i}>
                  <td className="border p-2 relative">
                    <input
                      value={r.itemName ?? ""}
                      onChange={(e) =>
                        lookupItem(e.target.value, i)
                      }
                      className="w-full border p-1 rounded"
                    />

                    {activeRow === i && suggestions.length > 0 && (
                      <div className="absolute z-50 bg-white border w-full shadow">
                        {suggestions.map((s) => (
                          <div
                            key={s.itemName}
                            onClick={() => selectItem(i, s)}
                            className="px-2 py-1 hover:bg-blue-100 cursor-pointer"
                          >
                            {s.itemName} — ₹{s.rate} (Stock:{" "}
                            {s.availableQty})
                          </div>
                        ))}
                      </div>
                    )}

                    {r.fromStock &&
                      r.availableQty !== undefined &&
                      r.qtyUsed > r.availableQty && (
                        <p className="text-xs text-red-600">
                          Only {r.availableQty} in stock
                        </p>
                      )}
                  </td>

                  <td className="border p-2">
                    <input
                      type="number"
                      min={0}
                      value={r.qtyUsed ?? 0}
                      onChange={(e) =>
                        updateRow(i, "qtyUsed", Number(e.target.value))
                      }
                      className="w-full border p-1 rounded"
                    />
                  </td>

                  <td className="border p-2 text-center">
                    {r.fromStock ? (
                      <>₹{r.rate}</>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        value={r.rate ?? 0}
                        onChange={(e) =>
                          updateRow(i, "rate", Number(e.target.value))
                        }
                        className="w-full border p-1 rounded"
                      />
                    )}
                  </td>

                  <td className="border p-2 text-center">
                    ₹{r.cost}
                  </td>

                  <td className="border p-2 text-center">
                    {inputs.length > 1 && (
                      <button
                        onClick={() => removeRow(i)}
                        className="text-red-600"
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={addRow}
          className="mt-3 px-3 py-1 border rounded bg-gray-50"
        >
          + Add Raw Material
        </button>

        {/* SUMMARY */}
        <div className="mt-6 flex justify-between items-center border-t pt-4">
          <div className="text-lg font-semibold">
            Total Cost: ₹{totalCost}
          </div>

          <button
            disabled={!canSave || saving}
            onClick={saveManufacturing}
            className={`px-6 py-2 rounded text-white ${
              canSave
                ? "bg-blue-600"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {saving ? "Saving..." : "Save Manufacturing"}
          </button>
        </div>
      </div>
    </div>
  );
}
