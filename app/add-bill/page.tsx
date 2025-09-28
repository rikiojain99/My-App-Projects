"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

type Customer = { name: string; type: string; city: string; mobile: string };
type Item = { name: string; qty: number; rate: number; total: number };
type ItemType = { _id: string; name: string };

export default function AddBill() {
  const [customer, setCustomer] = useState<Customer>({ name: "", type: "", city: "", mobile: "" });
  const [items, setItems] = useState<Item[]>([{ name: "", qty: 1, rate: 0, total: 0 }]);
  const [message, setMessage] = useState("");
  const [billNo] = useState(`BILL-${Date.now()}`);
  const grandTotal = useMemo(() => items.reduce((sum, i) => sum + i.total, 0), [items]);

  const handleCustomerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomer({ ...customer, [name]: value });
    if (name === "mobile" && value.length === 10) {
      try {
        const res = await fetch(`/api/customers?mobile=${value}`);
        if (res.ok) {
          const existing = await res.json();
          if (existing) setCustomer({ name: existing.name, type: existing.type, city: existing.city, mobile: existing.mobile });
        }
      } catch (err) { console.error(err); }
    }
  };

  const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newItems = [...items];
    if (name === "name") newItems[index].name = value;
    else if (name === "qty") newItems[index].qty = Number(value);
    else if (name === "rate") newItems[index].rate = Number(value);
    newItems[index].total = newItems[index].qty * newItems[index].rate;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { name: "", qty: 1, rate: 0, total: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const customerRes = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(customer) });
      if (!customerRes.ok) { setMessage("❌ Failed to save customer"); return; }
      const billRes = await fetch("/api/bills", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mobile: customer.mobile, items, grandTotal, billNo }) });
      if (!billRes.ok) { setMessage("❌ Failed to save bill"); return; }
      setMessage("✅ Bill saved successfully!");
      setCustomer({ name: "", type: "", city: "", mobile: "" });
      setItems([{ name: "", qty: 1, rate: 0, total: 0 }]);
    } catch (err) { console.error(err); setMessage("❌ Something went wrong"); }
  };

  return (
    <ProtectedRoute>
<div className="p-5 m-8 max-w-md bg-amber-700 mx-auto text-black ">
      <h1 className="text-xl font-bold mb-4 text-black">Add Bill</h1>
      {message && <p className="mb-4 text-green-600">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Inputs */}
        <input type="text" name="name" placeholder="Customer Name" value={customer.name} onChange={handleCustomerChange} className="w-full p-2 border rounded text-black" required />
        <input type="text" name="type" placeholder="Customer Type" value={customer.type} onChange={handleCustomerChange} className="w-full p-2 border rounded text-black" required />
        <input type="text" name="city" placeholder="City" value={customer.city} onChange={handleCustomerChange} className="w-full p-2 border rounded text-black" />
        <input type="tel" name="mobile" placeholder="Mobile Number" value={customer.mobile} onChange={handleCustomerChange} className="w-full p-2 border rounded text-black" pattern="[0-9]{10}" maxLength={10} required />

        {/* Items */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-black">Items</h2>
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-5 gap-2 items-center">
              <ItemNameInput index={index} items={items} handleItemChange={handleItemChange} />
              <input type="number" name="qty" placeholder="Qty" value={item.qty} onChange={(e) => handleItemChange(index, e)} className="p-2 border rounded text-black" required />
              <input type="number" name="rate" placeholder="Rate" value={item.rate} onChange={(e) => handleItemChange(index, e)} className="p-2 border rounded text-black" required />
              <span className="text-black font-medium">{item.total}</span>
              {items.length > 1 && <button type="button" onClick={() => removeItem(index)} className="text-red-500 text-sm">✕</button>}
            </div>
          ))}
          <button type="button" onClick={addItem} className="mt-2 px-3 py-1 bg-green-500 text-white rounded">+ Add Item</button>
        </div>

        {/* Grand Total */}
        <div className="flex justify-between items-center mt-4 p-2 border-t">
          <span className="font-bold text-black">Grand Total:</span>
          <span className="font-bold text-black">{grandTotal}</span>
        </div>

        <button type="submit" className="w-full py-2 px-4 bg-blue-500 text-white font-bold rounded">Save Bill</button>
      </form>
    </div>
    </ProtectedRoute>
    
  );
}

// ----------------- Item Name Input with Suggestion -----------------
function ItemNameInput({ index, items, handleItemChange }: { index: number; items: Item[]; handleItemChange: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void }) {
  const [query, setQuery] = useState(items[index].name);
  const [suggestions, setSuggestions] = useState<ItemType[]>([]);
  const [cachedResults, setCachedResults] = useState<ItemType[]>([]);
  const lastAPILength = useRef(0);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (query.length < 3) { setSuggestions([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const diff = query.length - lastAPILength.current;
      if (lastAPILength.current === 0 && query.length === 3) await fetchItems(query);
      else if (diff >= 3) await fetchItems(query);
      else setSuggestions(cachedResults.filter(i => i.name.toLowerCase().includes(query.toLowerCase())));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const fetchItems = async (search: string) => {
    try {
      const res = await fetch(`/api/items?search=${search}`);
      if (res.ok) { const data: ItemType[] = await res.json(); setSuggestions(data); setCachedResults(data); lastAPILength.current = search.length; }
    } catch (err) { console.error(err); }
  };

  const handleSelect = (item: ItemType) => {
    handleItemChange(index, { target: { name: "name", value: item.name } } as any);
    setQuery(item.name);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <input type="text" name="name" placeholder="Item Name" value={query} onChange={(e) => { setQuery(e.target.value); handleItemChange(index, e); }} className="p-2 border rounded text-black" />
      {suggestions.length > 0 && (
        <ul className="absolute z-10 bg-white border rounded shadow-md mt-1 w-full max-h-32 overflow-y-auto">
          {suggestions.map(item => (
            <li key={item._id} className="px-2 py-1 cursor-pointer hover:bg-blue-100" onClick={() => handleSelect(item)}>
              {item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
