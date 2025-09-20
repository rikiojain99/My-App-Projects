"use client";
import { useEffect, useState } from "react";

interface Purchase {
  itemName: string;
  qty: number;
  rate: number;
  total: number;
}

interface Bill {
  _id: string;
  customerName: string;
  customerType: string;
  city: string;
  mobile: string;
  purchases: Purchase[];
  grandTotal: number;
  createdAt: string;
}

export default function ViewBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBills() {
      try {
        const res = await fetch("/api/bills");
        const data = await res.json();
        setBills(data);
      } catch (err) {
        console.error("Failed to fetch bills", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBills();
  }, []);

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  if (bills.length === 0) {
    return <div className="text-center mt-10">No bills found.</div>;
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-bold text-center mb-4">All Bills</h1>
      {bills.map((bill) => (
        <div
          key={bill._id}
          className="bg-white p-4 rounded-xl shadow flex flex-col space-y-2"
        >
          <div className="flex justify-between">
            <span className="font-bold">{bill.customerName}</span>
            <span className="font-bold text-green-600">₹ {bill.grandTotal}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>{bill.customerType}</span>
            <span>{new Date(bill.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="text-sm text-gray-600">
            {bill.city} | {bill.mobile}
          </div>
        </div>
      ))}
    </div>
  );
}
