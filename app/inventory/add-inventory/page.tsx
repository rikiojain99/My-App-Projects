"use client";

import { useState, useRef, useEffect } from "react";

type ItemType = { _id: string; name: string };
type ShopType = 1 | 2 | 3; // Shop1=1, Home=2, Shop2=3

export default function AddInventory() {
  const [shop, setShop] = useState<ShopType>(1);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [qty, setQty] = useState(1);
  const [rate, setRate] = useState(0);
  const [total, setTotal] = useState(0);
  const [suggestions, setSuggestions] = useState<ItemType[]>([]);
  const [message, setMessage] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTotal(qty * rate);
  }, [qty, rate]);

  useEffect(() => {
    if (name.length < 2) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/inventory?search=${name}`);
        if (res.ok) {
          const data: ItemType[] = await res.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [name]);

  const handleSelectSuggestion = (item: ItemType) => {
    setName(item.name);
    setSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, category, qty, rate, shop }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessage(`Fail: ${data.error || "Failed to save item"}`);
      } else {
        setMessage(`Saved. Current qty: ${data.item.qty}`);
        setName("");
        setType("");
        setCategory("");
        setQty(1);
        setRate(0);
      }
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong");
    }
  };

  return (
    <div className="p-4 text-black max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-xl font-bold mb-4">Add / Update Inventory</h1>

      <div className="flex gap-4 mb-3">
        <label>
          <input type="radio" name="shop" value={1} checked={shop === 1} onChange={() => setShop(1)} /> Shop1
        </label>
        <label>
          <input type="radio" name="shop" value={2} checked={shop === 2} onChange={() => setShop(2)} /> Home
        </label>
        <label>
          <input type="radio" name="shop" value={3} checked={shop === 3} onChange={() => setShop(3)} /> Shop2
        </label>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item Name"
            className="w-full p-2 border rounded"
            required
          />
          {suggestions.length > 0 && (
            <ul className="absolute z-10 bg-white border rounded shadow-md w-full max-h-32 overflow-y-auto">
              {suggestions.map((item) => (
                <li
                  key={item._id}
                  className="px-2 py-1 cursor-pointer hover:bg-blue-100"
                  onClick={() => handleSelectSuggestion(item)}
                >
                  {item.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <input type="text" placeholder="Type" value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 border rounded" />
        <input type="text" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border rounded" />
        <input type="number" placeholder="Qty" value={qty} onChange={(e) => setQty(Number(e.target.value))} min={1} className="w-full p-2 border rounded" required />
        <input type="number" placeholder="Rate" value={rate} onChange={(e) => setRate(Number(e.target.value))} min={0} className="w-full p-2 border rounded" required />

        <div className="font-bold text-black">Total: {total}</div>

        <button type="submit" className="w-full py-2 px-4 bg-green-500 text-white font-bold rounded hover:opacity-90">
          Save Item
        </button>
      </form>

      {message && <p className={`mt-2 ${message.includes("Fail") ? "text-red-500" : "text-green-600"}`}>{message}</p>}
    </div>
  );
}
