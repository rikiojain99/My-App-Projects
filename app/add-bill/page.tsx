"use client";
import { useState } from "react";

interface Purchase {
  itemName: string;
  qty: number;
  rate: number;
  total: number;
}

export default function AddBill() {
  const [customer, setCustomer] = useState({
    customerName: "",
    customerType: "",
    city: "",
    mobile: "",
  });

  const [purchases, setPurchases] = useState<Purchase[]>([
    { itemName: "", qty: 1, rate: 0, total: 0 },
  ]);

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  };

  const handlePurchaseChange = (index: number, field: string, value: string | number) => {
    const newPurchases = [...purchases];
    (newPurchases[index] as any)[field] = field === "itemName" ? value : Number(value);
    newPurchases[index].total = newPurchases[index].qty * newPurchases[index].rate;
    setPurchases(newPurchases);
  };

  const addRow = () => {
    setPurchases([...purchases, { itemName: "", qty: 1, rate: 0, total: 0 }]);
  };

  const removeRow = (index: number) => {
    const newPurchases = purchases.filter((_, i) => i !== index);
    setPurchases(newPurchases);
  };

  const grandTotal = purchases.reduce((acc, item) => acc + item.total, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.customerName || !customer.mobile) {
      alert("Please fill customer details");
      return;
    }

    const res = await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...customer,
        purchases,
        grandTotal,
      }),
    });

    const result = await res.json();
    if (res.ok) {
      alert("Bill saved successfully!");
      // reset form
      setCustomer({ customerName: "", customerType: "", city: "", mobile: "" });
      setPurchases([{ itemName: "", qty: 1, rate: 0, total: 0 }]);
    } else {
      alert("Failed: " + result.error);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4 text-center">Add Bill</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-xl shadow-md">
        {/* Customer Info */}
        <input
          type="text"
          name="customerName"
          placeholder="Customer Name"
          value={customer.customerName}
          onChange={handleCustomerChange}
          className="w-full p-2 border rounded text-black"
          required
        />
        <select
          name="customerType"
          value={customer.customerType}
          onChange={handleCustomerChange}
          className="w-full p-2 border rounded text-black"
        >
          <option value="">Select Customer Type</option>
          <option value="Regular">cash</option>
          <option value="Regular">Decoretion</option>
          <option value="One-time">Ele</option>
        </select>
        <input
          type="text"
          name="city"
          placeholder="City"
          value={customer.city}
          onChange={handleCustomerChange}
          className="w-full p-2 border rounded text-black"
        />
        <input
  type="tel" // tel is better for mobile numeric keypad
  name="mobile"
  placeholder="Mobile Number"
  value={customer.mobile}
  onChange={(e) => {
    // allow only numbers
    const value = e.target.value.replace(/\D/g, "");
    // limit to 10 digits
    if (value.length <= 10) {
      setCustomer({ ...customer, mobile: value });
    }
  }}
  pattern="\d{10}" // HTML5 validation: exactly 10 digits
  maxLength={10}   // extra safety
  className="w-full p-2 border rounded text-black"
  required
/>


        {/* Purchases */}
        <div className="space-y-2">
          {purchases.map((item, index) => (
            <div key={index} className="flex gap-2 items-center text-black">
              <input
                type="text"
                placeholder="Item Name"
                value={item.itemName}
                onChange={(e) => handlePurchaseChange(index, "itemName", e.target.value)}
                className="w-36 p-1 border rounded"
                required
              />
              <input
                type="number"
                placeholder="Qty"
                value={item.qty}
                onChange={(e) => handlePurchaseChange(index, "qty", e.target.value)}
                className="w-16 p-1 border rounded"
                min={1}
              />
              <input
                type="number"
                placeholder="Rate"
                value={item.rate}
                onChange={(e) => handlePurchaseChange(index, "rate", e.target.value)}
                className="w-16 p-1 border rounded"
                min={0}
              />
              <span className="w-20 text-center">{item.total}</span>
              {purchases.length > 1 && (
                <button type="button" onClick={() => removeRow(index)} className="text-red-500">
                  ❌
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addRow} className="text-blue-600 mt-2">
            ➕ Add Item
          </button>
        </div>

        {/* Grand Total */}
        <div className="text-right font-bold mt-2 text-black">Grand Total: {grandTotal}</div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Save Bill
        </button>
      </form>
    </div>
  );    
}
