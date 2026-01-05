"use client";
import { useState } from "react";

type InventryItem = {
  name: string;
  type: string;
  cty: string;
  qty: number;
  rate: number;
  shop?: number; // optional in frontend, default will be added
};

export default function AddInventry() {
  const [item, setItem] = useState<InventryItem>({
    name: "",
    type: "",
    cty: "",
    qty: 1,
    rate: 0,
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setItem({
      ...item,
      [name]: name === "qty" || name === "rate" ? Number(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      // Always add shop = 1
      const payload = { ...item, shop: 1 };

      const res = await fetch("/api/inventry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(`❌ ${data.error || "Failed to save item"}`);
      } else {
        setMessage(`✅ Item saved! Current qty: ${data.item.qty}`);
        setItem({ name: "", type: "", cty: "", qty: 1, rate: 0 });
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-xl font-bold mb-4 text-black">Add Inventory Item</h1>
      {message && (
        <p
          className={`mb-4 ${
            message.includes("❌") ? "text-red-500" : "text-green-600"
          }`}
        >
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          name="name"
          placeholder="Item Name"
          value={item.name}
          onChange={handleChange}
          className="w-full p-2 border rounded text-black"
          required
        />
        <input
          type="text"
          name="type"
          placeholder="Type"
          value={item.type}
          onChange={handleChange}
          className="w-full p-2 border rounded text-black"
        />
        <input
          type="text"
          name="cty"
          placeholder="Category"
          value={item.cty}
          onChange={handleChange}
          className="w-full p-2 border rounded text-black"
        />
        <input
          type="number"
          name="qty"
          placeholder="Quantity"
          value={item.qty}
          onChange={handleChange}
          className="w-full p-2 border rounded text-black"
          min={1}
          required
        />
        <input
          type="number"
          name="rate"
          placeholder="Rate"
          value={item.rate}
          onChange={handleChange}
          className="w-full p-2 border rounded text-black"
          min={0}
          required
        />
        <button
          type="submit"
          className="w-full py-2 px-4 bg-green-500 text-white font-bold rounded hover:opacity-90"
          disabled={loading}
        >
          {loading ? "Saving..." : "Add Item"}
        </button>
      </form>
    </div>
  );
}
