"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import VendorSection from "@/components/stock/VendorSection";
import ItemsSection from "@/components/stock/ItemsSection";
import ExpenseSection from "@/components/stock/ExpenseSection";
import TotalsSection from "@/components/stock/TotalsSection";
import SaveStatusPopup, {
  type SavePopupStatus,
} from "@/components/ui/SaveStatusPopup";

export type StockItem = {
  name: string;
  qty: number;
  rate: number;
  total: number;
};

export default function Stock() {
  const [vendorName, setVendorName] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [items, setItems] = useState<StockItem[]>([
    { name: "", qty: 0, rate: 0, total: 0 },
  ]);
  const [message, setMessage] = useState("");
  const [savePopup, setSavePopup] = useState<{
    open: boolean;
    status: SavePopupStatus;
    title: string;
    message: string;
  }>({
    open: false,
    status: "saving",
    title: "",
    message: "",
  });
  const [extraExpense, setExtraExpense] = useState(0);

  const [vendors, setVendors] = useState<string[]>([]);
  const [showVendorSuggestions, setShowVendorSuggestions] = useState(false);

  const itemRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* -------- SET TODAY DATE -------- */
  useEffect(() => {
    setPurchaseDate(new Date().toISOString().slice(0, 10));
  }, []);

  /* -------- FETCH UNIQUE VENDORS -------- */
  useEffect(() => {
    fetch("/api/stock")
      .then((res) => res.json())
      .then((data) => {
        const map = new Map<string, string>();
        data.forEach((s: any) => {
          const key = s.vendorName.trim().toLowerCase();
          if (!map.has(key)) map.set(key, s.vendorName.trim());
        });
        setVendors(Array.from(map.values()));
      });
  }, []);

  /* -------- SUBTOTAL -------- */
  const subTotal = useMemo(
    () => items.reduce((sum, i) => sum + i.total, 0),
    [items]
  );

  /* -------- GRAND TOTAL -------- */
  const grandTotal = useMemo(
    () => subTotal + extraExpense,
    [subTotal, extraExpense]
  );

  /* -------- ITEM CHANGE -------- */
  const handleItemChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const newItems = [...items];

    if (name === "name") newItems[index].name = value;
    if (name === "qty" || name === "rate") {
      const digitsOnly = value.replace(/\D/g, "");
      const numericValue = digitsOnly === "" ? 0 : Number(digitsOnly);

      if (name === "qty") newItems[index].qty = numericValue;
      if (name === "rate") newItems[index].rate = numericValue;
    }

    newItems[index].total =
      newItems[index].qty * newItems[index].rate;

    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      { name: "", qty: 0, rate: 0, total: 0 },
    ]);

    setTimeout(() => {
      itemRefs.current[items.length]?.focus();
    }, 50);
  };

  const removeItem = (index: number) =>
    setItems(items.filter((_, i) => i !== index));

  /* -------- SUBMIT -------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      setSavePopup({
        open: true,
        status: "saving",
        title: "Saving stock",
        message: "Please wait while we save data.",
      });

      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorName: vendorName.trim(),
          purchaseDate,
          items,
          grandTotal,
          extraExpense,
        }),
      });

      if (!res.ok) {
        setMessage("Failed to save stock");
        setSavePopup({
          open: true,
          status: "error",
          title: "Save failed",
          message: "Failed to save stock",
        });
        return;
      }

      setMessage("Stock added successfully");
      setSavePopup({
        open: true,
        status: "success",
        title: "Stock saved",
        message: "Data has been saved successfully.",
      });

      setVendorName("");
      setPurchaseDate(new Date().toISOString().slice(0, 10));
      setItems([{ name: "", qty: 0, rate: 0, total: 0 }]);
      setExtraExpense(0);
    } catch {
      setMessage("Failed to save stock");
      setSavePopup({
        open: true,
        status: "error",
        title: "Save failed",
        message: "Network error while saving stock",
      });
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white border rounded-xl space-y-6 shadow-sm">
      <h1 className="text-2xl font-bold">Add Stock</h1>

      {message && (
        <p className="text-sm text-green-600">{message}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <VendorSection
          vendorName={vendorName}
          setVendorName={setVendorName}
          purchaseDate={purchaseDate}
          setPurchaseDate={setPurchaseDate}
          vendors={vendors}
          showVendorSuggestions={showVendorSuggestions}
          setShowVendorSuggestions={setShowVendorSuggestions}
        />

        <ItemsSection
          items={items}
          handleItemChange={handleItemChange}
          addItem={addItem}
          removeItem={removeItem}
          itemRefs={itemRefs}
        />

        <ExpenseSection
          extraExpense={extraExpense}
          setExtraExpense={setExtraExpense}
        />

        <TotalsSection
          subTotal={subTotal}
          extraExpense={extraExpense}
          grandTotal={grandTotal}
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold"
        >
          Save Stock
        </button>
      </form>
      <SaveStatusPopup
        open={savePopup.open}
        status={savePopup.status}
        title={savePopup.title}
        message={savePopup.message}
        onClose={() =>
          setSavePopup((prev) => ({ ...prev, open: false }))
        }
      />
    </div>
  );
}
