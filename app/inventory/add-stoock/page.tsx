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
  const [extraExpense, setExtraExpense] = useState(0);

  /* Vendor suggestion */
  const [vendors, setVendors] = useState<string[]>([]);
  const [showVendorSuggestions, setShowVendorSuggestions] =
    useState(false);

  /* Item refs for auto-focus */
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

  /* -------- GRAND TOTAL (WITH EXPENSE) -------- */
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
    if (name === "qty") newItems[index].qty = Number(value);
    if (name === "rate") newItems[index].rate = Number(value);

    newItems[index].total =
      newItems[index].qty * newItems[index].rate;

    setItems(newItems);
  };

  /* -------- AUTO ADD ITEM -------- */
  const addItem = () => {
    setItems([
      ...items,
      { name: "", qty: 1, rate: 0, total: 0 },
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

    const res = await fetch("/api/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendorName: vendorName.trim(),
        purchaseDate,
        items,
        grandTotal,
        extraExpense, // ✅ added
      }),
    });

    if (!res.ok) {
      setMessage("❌ Failed to save stock");
      return;
    }

    setMessage("✅ Stock added successfully");
    setVendorName("");
    setPurchaseDate(
      new Date().toISOString().slice(0, 10)
    );
    setItems([{ name: "", qty: 1, rate: 0, total: 0 }]);
    setExtraExpense(0);
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="p-6 max-w-3xl mx-auto bg-white border rounded-xl space-y-6 shadow-sm">
      <h1 className="text-2xl font-bold">
        Add Stock
      </h1>

      {message && (
        <p className="text-sm text-green-600">
          {message}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* ===== Vendor ===== */}
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
              setTimeout(
                () => setShowVendorSuggestions(false),
                200
              )
            }
            className="w-full p-3 border rounded"
            required
          />

          {showVendorSuggestions && vendorName && (
            <div className="absolute z-50 bg-white border rounded w-full max-h-40 overflow-y-auto shadow-lg">
              {vendors
                .filter((v) =>
                  v
                    .toLowerCase()
                    .includes(
                      vendorName.toLowerCase()
                    )
                )
                .map((v) => (
                  <div
                    key={v}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setVendorName(v);
                      setShowVendorSuggestions(
                        false
                      );
                    }}
                    className="px-3 py-2 cursor-pointer hover:bg-blue-50"
                  >
                    {v}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* ===== Date ===== */}
        <input
          type="date"
          value={purchaseDate}
          onChange={(e) =>
            setPurchaseDate(e.target.value)
          }
          className="w-full p-3 border rounded"
          required
        />

        {/* ===== Items ===== */}
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-2 items-center"
            >
              <div className="col-span-1 text-sm font-semibold text-gray-500">
                {index + 1}.
              </div>

              <div className="col-span-4">
                <ItemNameInput
                  value={item.name}
                  onChange={(e) =>
                    handleItemChange(index, e)
                  }
                  inputRef={(el) =>
                    (itemRefs.current[index] = el)
                  }
                  onEnter={addItem}
                />
              </div>

              <input
                name="qty"
                type="number"
                value={item.qty}
                onChange={(e) =>
                  handleItemChange(index, e)
                }
                className="col-span-2 p-2 border rounded"
              />

              <input
                name="rate"
                type="number"
                value={item.rate}
                onChange={(e) =>
                  handleItemChange(index, e)
                }
                className="col-span-2 p-2 border rounded"
              />

              <div className="col-span-2 text-right font-medium">
                ₹ {item.total}
              </div>

              <div className="col-span-1 text-right">
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      removeItem(index)
                    }
                    className="text-red-500"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          + Add Item
        </button>

        {/* ===== Extra Expense ===== */}
        <div className="border-t pt-4 space-y-2">
          <label className="text-sm text-gray-600">
            Additional Purchase Expense
          </label>
          <input
            type="number"
            value={extraExpense}
            onChange={(e) =>
              setExtraExpense(
                Number(e.target.value)
              )
            }
            className="w-full p-3 border rounded"
            placeholder="Transport / Loading / Other"
          />
        </div>

        {/* ===== Totals ===== */}
        <div className="space-y-1 border-t pt-4 text-lg">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹ {subTotal}</span>
          </div>

          {extraExpense > 0 && (
            <div className="flex justify-between text-orange-600">
              <span>Extra Expense</span>
              <span>₹ {extraExpense}</span>
            </div>
          )}

          <div className="flex justify-between font-bold text-xl">
            <span>Grand Total</span>
            <span>₹ {grandTotal}</span>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold"
        >
          Save Stock
        </button>
      </form>
    </div>
  );
}

/* =====================================================
   ITEM NAME INPUT WITH SUGGESTIONS + ENTER FOCUS
===================================================== */
function ItemNameInput({
  value,
  onChange,
  inputRef,
  onEnter,
}: {
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  inputRef: (
    el: HTMLInputElement | null
  ) => void;
  onEnter: () => void;
}) {
  const [suggestions, setSuggestions] =
    useState<string[]>([]);
  const debounceRef =
    useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current)
      clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(
      async () => {
        const res = await fetch(
          `/api/items?search=${value}`
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(
            data.map((i: any) => i.name)
          );
        }
      },
      300
    );

    return () => {
      if (debounceRef.current)
        clearTimeout(debounceRef.current);
    };
  }, [value]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        name="name"
        value={value}
        onChange={onChange}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnter();
          }
        }}
        placeholder="Item Name"
        className="p-2 border rounded w-full"
        autoComplete="off"
        required
      />

      {suggestions.length > 0 && (
        <div className="absolute z-50 bg-white border rounded w-full max-h-32 overflow-y-auto shadow-lg">
          {suggestions.map((s) => (
            <div
              key={s}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange({
                  target: {
                    name: "name",
                    value: s,
                  },
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
