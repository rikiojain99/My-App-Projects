/*
"use client";
import { useState, useMemo } from "react";

type Customer = {
  name: string;
  type: string;
  city: string;
  mobile: string;
};

type Item = {
  name: string;
  qty: number;
  rate: number;
  total: number;
};

export default function AddBill() {
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    type: "",
    city: "",
    mobile: "",
  });

  const [items, setItems] = useState<Item[]>([
    { name: "", qty: 1, rate: 0, total: 0 },
  ]);

  const [message, setMessage] = useState("");

  // ✅ Grand total (sum of all item totals)
  const grandTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.total, 0),
    [items]
  );

  // Handle customer input
  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomer({ ...customer, [name]: value });
  };

  // Handle item input safely
  const handleItemChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const newItems = [...items];

    if (name === "name") {
      newItems[index].name = value;
    } else if (name === "qty") {
      newItems[index].qty = Number(value);
    } else if (name === "rate") {
      newItems[index].rate = Number(value);
    }

    newItems[index].total = newItems[index].qty * newItems[index].rate;
    setItems(newItems);
  };

  // Add new item row
  const addItem = () => {
    setItems([...items, { name: "", qty: 1, rate: 0, total: 0 }]);
  };

  // Remove item row
  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      // 1. Save or fetch customer
      const customerRes = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer),
      });

      if (!customerRes.ok) {
        setMessage("❌ Failed to save customer");
        return;
      }

      // 2. Save bill with items + grandTotal
      const billRes = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: customer.mobile, items, grandTotal }),
      });

      if (!billRes.ok) {
        setMessage("❌ Failed to save bill");
        return;
      }

      setMessage("✅ Bill saved successfully!");
      setCustomer({ name: "", type: "", city: "", mobile: "" });
      setItems([{ name: "", qty: 1, rate: 0, total: 0 }]);
    } catch (error) {
      console.error(error);
      setMessage("❌ Something went wrong");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-amber-50" >
      <h1 className="text-xl font-bold mb-4 text-black">Add Bill</h1>

      {message && <p className="mb-4 text-green-600">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Customer Name"
          value={customer.name}
          onChange={handleCustomerChange}
          className="w-full p-2 border rounded text-black"
          required
        />
        <input
          type="text"
          name="type"
          placeholder="Customer Type"
          value={customer.type}
          onChange={handleCustomerChange}
          className="w-full p-2 border rounded text-black"
          required
        />
        <input
          type="text"
          name="city"
          placeholder="City"
          value={customer.city}
          onChange={handleCustomerChange}
          className="w-full p-2 border rounded text-black"
        />
        <input
          type="tel"
          name="mobile"
          placeholder="Mobile Number"
          value={customer.mobile}
          onChange={handleCustomerChange}
          className="w-full p-2 border rounded text-black"
          pattern="[0-9]{10}"
          maxLength={10}
          required
        />

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-black">Items</h2>
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-5 gap-2 items-center">
              <input
                type="text"
                name="name"
                placeholder="Item Name"
                value={item.name}
                onChange={(e) => handleItemChange(index, e)}
                className="p-2 border rounded text-black"
                required
              />
              <input
                type="number"
                name="qty"
                placeholder="Qty"
                value={item.qty}
                onChange={(e) => handleItemChange(index, e)}
                className="p-2 border rounded text-black"
                required
              />
              <input
                type="number"
                name="rate"
                placeholder="Rate"
                value={item.rate}
                onChange={(e) => handleItemChange(index, e)}
                className="p-2 border rounded text-black"
                required
              />
              <span className="text-black font-medium">{item.total}</span>

              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-500 text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addItem}
            className="mt-2 px-3 py-1 bg-green-500 text-white rounded"
          >
            + Add Item
          </button>
        </div>

        <div className="flex justify-between items-center mt-4 p-2 border-t">
          <span className="font-bold text-black">Grand Total:</span>
          <span className="font-bold text-black">{grandTotal}</span>
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-500 text-white font-bold rounded"
        >
          Save Bill
        </button>
      </form>
    </div>
  );
}
*/
"use client";
import { useState, useMemo } from "react";

type Customer = {
  name: string;
  type: string;
  city: string;
  mobile: string;
};

type Item = {
  name: string;
  qty: number;
  rate: number;
  total: number;
};

export default function AddBill() {
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    type: "",
    city: "",
    mobile: "",
  });

  const [items, setItems] = useState<Item[]>([
    { name: "", qty: 1, rate: 0, total: 0 },
  ]);

  const [message, setMessage] = useState("");
  const [billNo] = useState(`BILL-${Date.now()}`); // ✅ hidden bill number

  // ✅ Grand total (sum of all item totals)
  const grandTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.total, 0),
    [items]
  );

  // Handle customer input
  const handleCustomerChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setCustomer({ ...customer, [name]: value });

    // ✅ Auto-fetch customer details if mobile entered
    if (name === "mobile" && value.length === 10) {
      try {
        const res = await fetch(`/api/customers?mobile=${value}`);
        if (res.ok) {
          const existingCustomer = await res.json();
          if (existingCustomer) {
            setCustomer({
              name: existingCustomer.name,
              type: existingCustomer.type,
              city: existingCustomer.city,
              mobile: existingCustomer.mobile,
            });
          }
        }
      } catch (err) {
        console.error("Customer fetch error:", err);
      }
    }
  };

  // Handle item input safely
  const handleItemChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const newItems = [...items];

    if (name === "name") {
      newItems[index].name = value;
    } else if (name === "qty") {
      newItems[index].qty = Number(value);
    } else if (name === "rate") {
      newItems[index].rate = Number(value);
    }

    newItems[index].total = newItems[index].qty * newItems[index].rate;
    setItems(newItems);
  };

  // Add new item row
  const addItem = () => {
    setItems([...items, { name: "", qty: 1, rate: 0, total: 0 }]);
  };

  // Remove item row
  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      // 1. Save or fetch customer
      const customerRes = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer),
      });

      if (!customerRes.ok) {
        setMessage("❌ Failed to save customer");
        return;
      }

      // 2. Save bill with items + grandTotal + billNo
      const billRes = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: customer.mobile,
          items,
          grandTotal,
          billNo, // ✅ send hidden bill number
        }),
      });

      if (!billRes.ok) {
        setMessage("❌ Failed to save bill");
        return;
      }

      setMessage("✅ Bill saved successfully!");
      setCustomer({ name: "", type: "", city: "", mobile: "" });
      setItems([{ name: "", qty: 1, rate: 0, total: 0 }]);
    } catch (error) {
      console.error(error);
      setMessage("❌ Something went wrong");
    }
  };

  return (
    <div className="p-4 max-w-md bg-amber-50 mx-auto">
      <h1 className="text-xl font-bold mb-4 text-black">Add Bill</h1>

      {message && <p className="mb-4 text-green-600">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer details */}
        <input
          type="text"
          name="name"
          placeholder="Customer Name"
          value={customer.name}
          onChange={handleCustomerChange}
          className="w-full p-2 border rounded text-black"
          required
        />
        <input
          type="text"
          name="type"
          placeholder="Customer Type"
          value={customer.type}
          onChange={handleCustomerChange}
          className="w-full p-2 border rounded text-black"
          required
        />
        <input
          type="text"
          name="city"
          placeholder="City"
          value={customer.city}
          onChange={handleCustomerChange}
          className="w-full p-2 border rounded text-black"
        />
        <input
          type="tel"
          name="mobile"
          placeholder="Mobile Number"
          value={customer.mobile}
          onChange={handleCustomerChange}
          className="w-full p-2 border rounded text-black"
          pattern="[0-9]{10}"
          maxLength={10}
          required
        />

        {/* Items table */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-black">Items</h2>
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-5 gap-2 items-center">
              <input
                type="text"
                name="name"
                placeholder="Item Name"
                value={item.name}
                onChange={(e) => handleItemChange(index, e)}
                className="p-2 border rounded text-black"
                required
              />
              <input
                type="number"
                name="qty"
                placeholder="Qty"
                value={item.qty}
                onChange={(e) => handleItemChange(index, e)}
                className="p-2 border rounded text-black"
                required
              />
              <input
                type="number"
                name="rate"
                placeholder="Rate"
                value={item.rate}
                onChange={(e) => handleItemChange(index, e)}
                className="p-2 border rounded text-black"
                required
              />
              <span className="text-black font-medium">{item.total}</span>

              {/* Remove button */}
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-500 text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {/* Add item button */}
          <button
            type="button"
            onClick={addItem}
            className="mt-2 px-3 py-1 bg-green-500 text-white rounded"
          >
            + Add Item
          </button>
        </div>

        {/* ✅ Grand total display */}
        <div className="flex justify-between items-center mt-4 p-2 border-t">
          <span className="font-bold text-black">Grand Total:</span>
          <span className="font-bold text-black">{grandTotal}</span>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-500 text-white font-bold rounded"
        >
          Save Bill
        </button>
      </form>
    </div>
  );
}
