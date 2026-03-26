"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import EnvPasskeyGate from "@/components/EnvPasskeyGate";

type ProfitItem = {
  itemName: string;
  soldQty: number;
  revenue: number;
  avgCost: number;
  profit: number;
};

type Summary = {
  totalRevenue: number;
  totalGrossProfit: number;
  totalExpense: number;
  netProfit: number;
};

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);

export default function ProfitReport() {
  const [items, setItems] = useState<ProfitItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    if (fromDate && toDate && fromDate > toDate) {
      setError("From date cannot be after To date.");
      setLoading(false);
      return;
    }

    const fetchProfit = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        if (fromDate) params.set("from", fromDate);
        if (toDate) params.set("to", toDate);

        const url = params.toString()
          ? `/api/reports/profit?${params.toString()}`
          : "/api/reports/profit";

        const res = await fetch(url, { signal: controller.signal });

        if (!res.ok) {
          throw new Error("Failed to load profit report");
        }

        const payload = await res.json();
        setItems(payload.items || []);
        setSummary(payload.summary || null);
      } catch (e: any) {
        if (e.name === "AbortError") return;
        setError(e?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchProfit();

    return () => controller.abort();
  }, [fromDate, toDate]);

  const setPreset = (type: "today" | "week" | "month") => {
    const today = new Date();
    const from = new Date(today);

    if (type === "week") from.setDate(today.getDate() - 7);
    if (type === "month") from.setMonth(today.getMonth() - 1);

    setFromDate(from.toISOString().slice(0, 10));
    setToDate(today.toISOString().slice(0, 10));
  };

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
  };

  const metrics = useMemo(() => {
    const revenue = roundMoney(
      items.reduce((sum, item) => sum + Number(item.revenue || 0), 0)
    );
    const cogs = roundMoney(
      items.reduce(
        (sum, item) =>
          sum + Number(item.soldQty || 0) * Number(item.avgCost || 0),
        0
      )
    );
    const grossProfit = roundMoney(
      items.reduce((sum, item) => sum + Number(item.profit || 0), 0)
    );
    const directExpense = roundMoney(Number(summary?.totalExpense || 0));
    const netProfit = roundMoney(grossProfit - directExpense);

    return {
      revenue,
      cogs,
      grossProfit,
      netProfit,
    };
  }, [items, summary]);

  const revenueMismatch =
    !!summary && Math.abs((summary.totalRevenue || 0) - metrics.revenue) > 1;

  const grossProfitMismatch =
    !!summary &&
    Math.abs((summary.totalGrossProfit || 0) - metrics.grossProfit) > 1;

  const netProfitMismatch =
    !!summary && Math.abs((summary.netProfit || 0) - metrics.netProfit) > 1;

  const dateRangeInvalid = fromDate && toDate && fromDate > toDate;

  return (
    <ProtectedRoute>
      <EnvPasskeyGate
        expectedPasskey={
          process.env.NEXT_PUBLIC_PROFIT_REPORT_PASSKEY || "1400"
        }
      >
        <div className="p-3 md:p-8 bg-white min-h-screen">
        <div className="flex gap-3 mt-1 mb-4 items-center">
       <h1 className="text-xl font-bold ">Profit Report</h1>

        <div className="ml-auto">
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className="border rounded px-3 py-2 bg-white hover:bg-gray-100 text-sm"
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        </div>
        
        {showFilters && (
          <div className="grid md:grid-cols-5 gap-2 mb-4 bg-slate-50 rounded-xl p-3 md:p-4 border border-slate-200">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border p-2 rounded w-full text-sm"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border p-2 rounded w-full text-sm"
            />
            <button
              onClick={() => setPreset("today")}
              className="border rounded px-3 py-2 bg-white hover:bg-gray-100 text-sm"
            >
              Today
            </button>
            <button
              onClick={() => setPreset("week")}
              className="border rounded px-3 py-2 bg-gray-50"
            >
              7 Days
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setPreset("month")}
                className="border rounded px-3 py-2 bg-gray-50 w-full"
              >
                1 Month
              </button>
              <button
                onClick={clearFilters}
                className="border rounded px-3 py-2 w-full"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="mb-4 rounded border p-3 text-gray-600">
            Loading profit report...
          </div>
        )}

        {dateRangeInvalid && !loading && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">
            Invalid range: "From" should be before or equal to "To".
          </div>
        )}

        {error && !loading && !dateRangeInvalid && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-6 mt-6">
          <div className="bg-slate-50 border rounded-lg p-3">
            <div className="text-sm text-gray-600">Revenue</div>
            <div className="text-lg font-bold text-blue-700">{formatINR(metrics.revenue)}</div>
          </div>
          <div className="bg-slate-50 border rounded-lg p-3">
            <div className="text-sm text-gray-600">COGS</div>
            <div className="text-lg font-bold text-rose-700">{formatINR(metrics.cogs)}</div>
          </div>
          <div className="bg-slate-50 border rounded-lg p-3">
            <div className="text-sm text-gray-600">Gross Profit</div>
            <div className="text-lg font-bold text-emerald-700">{formatINR(metrics.grossProfit)}</div>
          </div>
          {summary && (
            <div className="bg-slate-50 border rounded-lg p-3">
              <div className="text-sm text-gray-600">Net Profit</div>
              <div className="text-lg font-bold text-indigo-700">{formatINR(metrics.netProfit)}</div>
            </div>
          )}
        </div>

        {revenueMismatch && (
          <div className="mb-3 text-sm text-orange-700 bg-orange-50 border border-orange-200 p-2 rounded">
            Revenue mismatch: API {formatINR(summary?.totalRevenue || 0)} vs calculated {formatINR(metrics.revenue)}
          </div>
        )}

        {grossProfitMismatch && (
          <div className="mb-3 text-sm text-orange-700 bg-orange-50 border border-orange-200 p-2 rounded">
            Gross profit mismatch: API {formatINR(summary?.totalGrossProfit || 0)} vs calculated {formatINR(metrics.grossProfit)}
          </div>
        )}

        {netProfitMismatch && (
          <div className="mb-3 text-sm text-orange-700 bg-orange-50 border border-orange-200 p-2 rounded">
            Net profit mismatch: API {formatINR(summary?.netProfit || 0)} vs calculated {formatINR(metrics.netProfit)}
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
          <table className="w-full min-w-\[640px\] border text-sm md:text-base">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Item</th>
                <th className="border p-2">Sold Qty</th>
                <th className="border p-2">Revenue</th>
                <th className="border p-2">Avg Cost</th>
                <th className="border p-2">COGS</th>
                <th className="border p-2">Gross Profit</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className="border p-2 text-center" colSpan={6}>
                    No records found for selected date range.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const cogs = roundMoney(
                    Number(item.soldQty || 0) * Number(item.avgCost || 0)
                  );

                  return (
                    <tr key={`${item.itemName}-${idx}`}>
                      <td className="border p-2">{item.itemName}</td>
                      <td className="border p-2 text-center">{item.soldQty}</td>
                      <td className="border p-2 text-center">{formatINR(item.revenue)}</td>
                      <td className="border p-2 text-center">
                        {item.avgCost > 0 ? (
                          formatINR(item.avgCost)
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </td>
                      <td className="border p-2 text-center">{formatINR(cogs)}</td>
                      <td
                        className={`border p-2 text-center font-semibold ${
                          item.profit >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatINR(item.profit)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 font-bold text-lg">
          Total Gross Profit: {formatINR(metrics.grossProfit)}
        </div>

        <div className="text-sm text-gray-600 mb-3">
          Net Profit After Direct Expenses: {formatINR(metrics.netProfit)}
        </div>
        </div>
      </EnvPasskeyGate>
    </ProtectedRoute>
  );
}
