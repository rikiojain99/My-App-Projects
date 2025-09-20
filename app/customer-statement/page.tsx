"use client";
import { useState } from "react";

export default function CustomerStatement() {
  const [mobile, setMobile] = useState("");
  const [bills, setBills] = useState<any[]>([]);

  const fetchBills = async () => {
    const res = await fetch(`/api/customers/by-mobile?mobile=${mobile}`);
    const customer = await res.json();

    if (!customer?._id) return alert("Customer not found!");

    const resBills = await fetch(`/api/bills?customerId=${customer._id}`);
    const data = await resBills.json();
    setBills(data);
  };

  return (
    <div className="p-4 bg-amber-50" >
      <h1 className="text-xl font-bold mb-2">Customer Statement</h1>
      <input
        type="text"
        placeholder="Enter Mobile"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
        className="border p-2 rounded w-full mb-4 text-black"
      />
      <button
        onClick={fetchBills}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Get Statement
      </button>

      <div className="mt-4 bg-amber-50">
        {bills.map((bill) => (
          <div
            key={bill._id}
            className="border rounded p-3 mb-2 bg-white shadow"
          >
            <p>Total: ₹{bill.grandTotal}</p>
            <p>Date: {new Date(bill.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
