"use client";

import { useEffect, useState } from "react";
import React from "react";

/* ================= TYPES ================= */
type RawInput = {
  itemName: string;
  qtyUsed: number;
  rate: number;
  cost: number;
};

type ManufacturingRecord = {
  _id: string;
  productName: string;
  producedQty: number;
  inputs: RawInput[];
  totalCost: number;
  costPerUnit: number;
  createdAt: string;
};

/* ================= PAGE ================= */
export default function ManufacturingHistory() {
  const [data, setData] = useState<ManufacturingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [openRow, setOpenRow] = useState<string | null>(null);

  /* ================= LOAD ================= */
  useEffect(() => {
    fetch("/api/manufacturing")
      .then((r) => r.json())
      .then((d) => {
        setData(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading manufacturing history...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-xl font-semibold mb-6">
          Manufacturing History
        </h1>

        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="border p-2 text-left">Product</th>
                <th className="border p-2">Qty</th>
                <th className="border p-2">Total Cost</th>
                <th className="border p-2">Cost / Unit</th>
                <th className="border p-2">Date</th>
                <th className="border p-2"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((m) => {
  const open = openRow === m._id;

  return (
    <React.Fragment key={m._id}>
      <tr className="hover:bg-gray-50">
        <td className="border p-2 font-medium">
          {m.productName}
        </td>
        <td className="border p-2 text-center">
          {m.producedQty}
        </td>
        <td className="border p-2 text-center">
          ₹{Math.round(m.totalCost)}
        </td>
        <td className="border p-2 text-center">
          ₹{Math.round(m.costPerUnit)}
        </td>
        <td className="border p-2 text-center">
          {new Date(m.createdAt).toLocaleDateString()}
        </td>
        <td className="border p-2 text-center">
          <button
            onClick={() => setOpenRow(open ? null : m._id)}
            className="text-blue-600"
          >
            {open ? "Hide" : "View"}
          </button>
        </td>
      </tr>

      {open && (
        <tr>
          <td colSpan={6} className="border bg-gray-50 p-3">
            <table className="w-full text-xs border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-1 text-left">Raw Item</th>
                  <th className="border p-1">Qty Used</th>
                  <th className="border p-1">Rate</th>
                  <th className="border p-1">Cost</th>
                </tr>
              </thead>
              <tbody>
                {m.inputs.map((i, idx) => (
                  <tr key={`${m._id}-${idx}`}>
                    <td className="border p-1">{i.itemName}</td>
                    <td className="border p-1 text-center">{i.qtyUsed}</td>
                    <td className="border p-1 text-center">₹{i.rate}</td>
                    <td className="border p-1 text-center">
                      ₹{Math.round(i.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
})}

            </tbody>
          </table>
        </div>

        {data.length === 0 && (
          <p className="text-center text-gray-500 mt-6">
            No manufacturing records found.
          </p>
        )}
      </div>
    </div>
  );
}
