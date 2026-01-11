"use client";
import { useEffect, useMemo, useRef, useState } from "react";

/* ---------------- TYPES ---------------- */
type StockItem = {
  name: string;
  qty: number;
  rate: number;
  total: number;
};

/* ---------------- MAIN COMPONENT ---------------- */
export default function Stock() {
  const [vendorName, setVendorName] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [items, setItems] = useState<StockItem[]>([
    { name: "", qty: 1, rate: 0, total: 0 },
  ]);
  const [message, setMessage] = useState("");

  /* Vendor suggestion state */
  const [vendors, setVendors] = useState<string[]>([]);
  const [showVendorSuggestions, setShowVendorSuggestions] = useState(false);

  /* -------- SET CURRENT DATE -------- */
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setPurchaseDate(today);
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

  /* -------- TOTAL -------- */
  const grandTotal = useMemo(
    () => items.reduce((sum, i) => sum + i.total, 0),
    [items]
  );

  /* -------- ITEM CHANGE -------- */
  const handleItemChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const newItems = [...items];

    if (name === "name") newItems[index].name = value;
    if (name === "qty") newItems[index].qty = Number(value);
    if (name === "rate") newItems[index].rate = Number(value);

    newItems[index].total =
      newItems[index].qty * newItems[index].rate;

    setItems(newItems);
  };

  const addItem = () =>
    setItems([...items, { name: "", qty: 1, rate: 0, total: 0 }]);

  const removeItem = (index: number) =>
    setItems(items.filter((_, i) => i !== index));

  /* -------- SUBMIT -------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    const res = await fetch("/api/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendorName: vendorName.trim(),
        purchaseDate,
        items,
        grandTotal,
      }),
    });

    if (!res.ok) {
      setMessage("❌ Failed to save stock");
      return;
    }

    setMessage("✅ Stock added successfully");
    setVendorName("");
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setItems([{ name: "", qty: 1, rate: 0, total: 0 }]);
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="p-5 max-w-md mx-auto bg-amber-50 text-black" >
      <h1 className="text-xl font-bold text-black mb-4">Add Stock</h1>

      {message && <p className="mb-3 text-green-600">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* -------- VENDOR INPUT -------- */}
        <div className="relative">
          <input
            type="text"
            placeholder="Vendor Name"
            value={vendorName}
            onChange={(e) => {
              setVendorName(e.target.value);
              setShowVendorSuggestions(true);
            }}
            onBlur={() =>
              setTimeout(() => setShowVendorSuggestions(false), 200)
            }
            className="w-full p-2 border rounded text-black"
            required
          />

          {showVendorSuggestions && vendorName && (
            <div className="absolute z-50 bg-white border rounded w-full max-h-40 overflow-y-auto shadow-lg">
              {vendors
                .filter((v) =>
                  v.toLowerCase().includes(vendorName.toLowerCase())
                )
                .map((v) => (
                  <div
                    key={v}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setVendorName(v);
                      setShowVendorSuggestions(false);
                    }}
                    className="px-2 py-1 cursor-pointer hover:bg-blue-100"
                  >
                    {v}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* -------- DATE -------- */}
        <input
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          className="w-full p-2 border rounded text-black"
          required
        />

        {/* -------- ITEMS -------- */}
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-5 gap-2 items-center">
            <ItemNameInput
              value={item.name}
              onChange={(e) => handleItemChange(index, e)}
            />

            <input
              name="qty"
              type="number"
              placeholder="Qty"
              value={item.qty}
              onChange={(e) => handleItemChange(index, e)}
              className="p-2 border rounded text-black"
            />

            <input
              name="rate"
              type="number"
              placeholder="Rate"
              value={item.rate}
              onChange={(e) => handleItemChange(index, e)}
              className="p-2 border rounded text-black"
            />

            <span className="text-black">{item.total}</span>

            {items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-red-500"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addItem}
          className="bg-green-500 text-white px-3 py-1 rounded"
        >
          + Add Item
        </button>

        {/* -------- TOTAL -------- */}
        <div className="flex justify-between font-bold text-black border-t pt-2">
          <span>Total</span>
          <span>{grandTotal}</span>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded"
        >
          Save Stock
        </button>
      </form>
    </div>
  );
}

/* ===================================================
   ITEM NAME INPUT WITH SMART SUGGESTION (FIXED)
   =================================================== */
function ItemNameInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/items?search=${value}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.map((i: any) => i.name));
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  return (
    <div className="relative z-50">
      <input
        name="name"
        placeholder="Item"
        value={value}
        onChange={onChange}
        autoComplete="off"
        className="p-2 border rounded text-black w-full"
        required
      />

      {suggestions.length > 0 && (
        <div className="absolute z-50 bg-white border rounded w-full max-h-32 overflow-y-auto shadow-lg">
          {suggestions.map((s) => (
            <div
              key={s}
              onMouseDown={(e) => {
                e.preventDefault(); // ✅ critical
                onChange({
                  target: { name: "name", value: s },
                } as any);
                setSuggestions([]);
              }}
              className="px-2 py-1 cursor-pointer hover:bg-blue-100"
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
