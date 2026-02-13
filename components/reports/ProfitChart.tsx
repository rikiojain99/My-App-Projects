"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

export default function ProfitChart({
  bills = [],
  stocks = [],
}: {
  bills?: any[];
  stocks?: any[];
}) {
  /* ================= SAFE ARRAYS ================= */

  const safeBills = Array.isArray(bills) ? bills : [];
  const safeStocks = Array.isArray(stocks) ? stocks : [];

  const monthlyRevenue: Record<string, number> = {};
  const monthlyExpense: Record<string, number> = {};

  /* ================= REVENUE ================= */

  safeBills.forEach((bill: any) => {
    if (!bill?.createdAt) return;

    const month = new Date(
      bill.createdAt
    ).toISOString().slice(0, 7);

    monthlyRevenue[month] =
      (monthlyRevenue[month] || 0) +
      (bill.finalTotal || bill.grandTotal || 0);
  });

  /* ================= EXPENSE ================= */

  safeStocks.forEach((stock: any) => {
    if (!stock?.purchaseDate) return;

    const month = new Date(
      stock.purchaseDate
    ).toISOString().slice(0, 7);

    monthlyExpense[month] =
      (monthlyExpense[month] || 0) +
      (stock.grandTotal || 0);
  });

  /* ================= MERGE MONTHS ================= */

  const allMonths = Array.from(
    new Set([
      ...Object.keys(monthlyRevenue),
      ...Object.keys(monthlyExpense),
    ])
  ).sort();

  const data = allMonths.map((month) => {
    const revenue = monthlyRevenue[month] || 0;
    const expense = monthlyExpense[month] || 0;
    const profit = revenue - expense;

    const margin =
      revenue > 0
        ? Number(((profit / revenue) * 100).toFixed(1))
        : 0;

    return {
      month,
      revenue,
      expense,
      profit,
      margin,
    };
  });

  /* ================= EMPTY STATE ================= */

  if (data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl text-center text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm">
      <h3 className="font-semibold mb-4">
        Profit & Margin Analysis
      </h3>

      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="month" />

          <YAxis yAxisId="left" />

          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />

          <Tooltip
            formatter={(value: any, name: any) => {
              if (name === "margin")
                return [`${value}%`, "Margin %"];
              return [`₹ ${value}`, name];
            }}
          />

          <Legend />

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="revenue"
            stroke="#16a34a"
            strokeWidth={2}
          />

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="expense"
            stroke="#dc2626"
            strokeWidth={2}
          />

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="profit"
            stroke="#2563eb"
            strokeWidth={2}
          />

          <Line
            yAxisId="right"
            type="monotone"
            dataKey="margin"
            stroke="#f59e0b"
            strokeWidth={3}
            strokeDasharray="6 3"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
