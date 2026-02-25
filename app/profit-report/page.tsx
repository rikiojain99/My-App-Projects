"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import QuickStatsBar from "@/components/dashboard/QuickStatsBar";
import PaymentSummary from "@/components/dashboard/PaymentSummary";
import ProfitChart from "@/components/reports/ProfitChart";

type ProfitItem = {
  itemName: string;
  soldQty: number;
  revenue: number;
  avgCost: number;
  profit: number;
};

type TrendPoint = {
  month: string;
  revenue: number;
  expense: number;
  profit: number;
  margin: number;
};

type Summary = {
  totalRevenue: number;
  totalGrossProfit: number;
  totalExpense: number;
  netProfit: number;
};

export default function ProfitReport() {
  const [items, setItems] = useState<ProfitItem[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const formatINR = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value || 0);

  useEffect(() => {
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

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("Failed to load profit report");
        }

        const payload = await res.json();
        setItems(payload.items || []);
        setTrendData(payload.trendData || []);
        setSummary(payload.summary || null);
      } catch (e: any) {
        setError(e?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchProfit();
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

  const totalProfit = items.reduce((sum, i) => sum + i.profit, 0);

  return (
    <ProtectedRoute>
      <QuickStatsBar />
      <PaymentSummary />

      <div className="p-4 md:p-8 bg-white">
        <h1 className="text-xl font-bold mb-4">
          Profit Report
        </h1>

        <div className="grid md:grid-cols-5 gap-2 mb-4">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border p-2 rounded"
          />
          <button
            onClick={() => setPreset("today")}
            className="border rounded px-3 py-2 bg-gray-50"
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

        {loading && (
          <div className="mb-4 rounded border p-3 text-gray-600">
            Loading profit report...
          </div>
        )}

        {error && !loading && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && <ProfitChart data={trendData} />}

        {summary && !loading && !error && (
          <div className="grid md:grid-cols-4 gap-4 mb-6 mt-6">
            <SummaryCard
              label="Revenue"
              value={formatINR(summary.totalRevenue)}
              color="text-blue-600"
            />
            <SummaryCard
              label="Gross Profit"
              value={formatINR(summary.totalGrossProfit)}
              color="text-green-600"
            />
            <SummaryCard
              label="Expenses"
              value={formatINR(summary.totalExpense)}
              color="text-orange-600"
            />
            <SummaryCard
              label="Net Profit"
              value={formatINR(summary.netProfit)}
              color={
                summary.netProfit >= 0
                  ? "text-green-700"
                  : "text-red-600"
              }
            />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Item</th>
                <th className="border p-2">Sold Qty</th>
                <th className="border p-2">Revenue</th>
                <th className="border p-2">Avg Cost</th>
                <th className="border p-2">Profit</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.itemName}>
                  <td className="border p-2">{i.itemName}</td>
                  <td className="border p-2 text-center">{i.soldQty}</td>
                  <td className="border p-2 text-center">{formatINR(i.revenue)}</td>
                  <td className="border p-2 text-center">{formatINR(i.avgCost)}</td>
                  <td
                    className={`border p-2 text-center font-semibold ${
                      i.profit >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatINR(i.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 font-bold text-lg">
          Total Gross Profit: {formatINR(totalProfit)}
        </div>

        {summary && (
          <div className="mt-2 text-lg font-bold">
            Net Profit After Expenses: {formatINR(summary.netProfit)}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-gray-50 border rounded-lg p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}
