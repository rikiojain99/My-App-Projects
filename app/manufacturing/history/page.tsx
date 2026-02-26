"use client";

import { useEffect, useMemo, useState } from "react";
import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

type RawInput = {
  itemName: string;
  qtyUsed: number;
  rate: number;
  cost: number;
  fromStock?: boolean;
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

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const toDateOnly = (value: string) =>
  new Date(value).toISOString().slice(0, 10);

export default function ManufacturingHistory() {
  const [data, setData] = useState<ManufacturingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    fetch("/api/manufacturing")
      .then((r) => r.json())
      .then((d) => {
        setData(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();

    return data.filter((m) => {
      const product = String(m.productName || "").toLowerCase();
      const dateOnly = toDateOnly(m.createdAt);

      const matchesSearch =
        !q ||
        product.includes(q) ||
        m.inputs.some((i) =>
          String(i.itemName || "").toLowerCase().includes(q)
        );

      const matchesFrom = !fromDate || dateOnly >= fromDate;
      const matchesTo = !toDate || dateOnly <= toDate;

      return matchesSearch && matchesFrom && matchesTo;
    });
  }, [data, fromDate, search, toDate]);

  const summary = useMemo(() => {
    const totalBatches = filteredData.length;
    const totalProducedQty = filteredData.reduce(
      (sum, row) => sum + Number(row.producedQty || 0),
      0
    );
    const totalCost = filteredData.reduce(
      (sum, row) => sum + Number(row.totalCost || 0),
      0
    );

    return { totalBatches, totalProducedQty, totalCost };
  }, [filteredData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading manufacturing history...
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 p-4 md:p-6">
        <div className="max-w-6xl mx-auto bg-white p-4 md:p-6 rounded shadow space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h1 className="text-xl font-semibold">
              Manufacturing History
            </h1>
            <p className="text-sm text-gray-500">
              Review batches and raw material usage
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product or raw item..."
              className="border rounded px-3 py-2"
            />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border rounded px-3 py-2"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border rounded px-3 py-2"
            />
            <button
              onClick={() => {
                setSearch("");
                setFromDate("");
                setToDate("");
              }}
              className="border rounded px-3 py-2 bg-gray-50"
            >
              Clear Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SummaryCard
              label="Batches"
              value={String(summary.totalBatches)}
            />
            <SummaryCard
              label="Produced Qty"
              value={summary.totalProducedQty.toLocaleString()}
            />
            <SummaryCard
              label="Total Manufacturing Cost"
              value={formatINR(summary.totalCost)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border p-2 text-left">Product</th>
                  <th className="border p-2">Qty</th>
                  <th className="border p-2">Raw Items</th>
                  <th className="border p-2">Total Cost</th>
                  <th className="border p-2">Cost / Unit</th>
                  <th className="border p-2">Date</th>
                  <th className="border p-2"></th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((m) => {
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
                          {m.inputs?.length || 0}
                        </td>
                        <td className="border p-2 text-center">
                          {formatINR(m.totalCost)}
                        </td>
                        <td className="border p-2 text-center">
                          {formatINR(m.costPerUnit)}
                        </td>
                        <td className="border p-2 text-center">
                          {new Date(m.createdAt).toLocaleDateString()}
                        </td>
                        <td className="border p-2 text-center">
                          <button
                            onClick={() =>
                              setOpenRow(open ? null : m._id)
                            }
                            className="text-blue-600"
                          >
                            {open ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>

                      {open && (
                        <tr>
                          <td
                            colSpan={7}
                            className="border bg-gray-50 p-3"
                          >
                            <table className="w-full text-xs border">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="border p-1 text-left">
                                    Raw Item
                                  </th>
                                  <th className="border p-1">
                                    Source
                                  </th>
                                  <th className="border p-1">
                                    Qty Used
                                  </th>
                                  <th className="border p-1">Rate</th>
                                  <th className="border p-1">Cost</th>
                                </tr>
                              </thead>
                              <tbody>
                                {m.inputs.map((input, idx) => (
                                  <tr
                                    key={`${m._id}-${idx}`}
                                  >
                                    <td className="border p-1">
                                      {input.itemName}
                                    </td>
                                    <td className="border p-1 text-center">
                                      <span
                                        className={`inline-flex rounded px-2 py-0.5 ${
                                          input.fromStock === false
                                            ? "bg-amber-100 text-amber-700"
                                            : "bg-emerald-100 text-emerald-700"
                                        }`}
                                      >
                                        {input.fromStock === false
                                          ? "Manual"
                                          : "Stock"}
                                      </span>
                                    </td>
                                    <td className="border p-1 text-center">
                                      {input.qtyUsed}
                                    </td>
                                    <td className="border p-1 text-center">
                                      {formatINR(input.rate)}
                                    </td>
                                    <td className="border p-1 text-center">
                                      {formatINR(input.cost)}
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

          {filteredData.length === 0 && (
            <p className="text-center text-gray-500 mt-2">
              No manufacturing records found.
            </p>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
