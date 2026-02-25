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

type ProfitPoint = {
  month: string;
  revenue: number;
  expense: number;
  profit: number;
  margin: number;
};

export default function ProfitChart({
  data = [],
}: {
  data?: ProfitPoint[];
}) {
  const chartData = Array.isArray(data) ? data : [];

  const formatINR = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value || 0);

  if (chartData.length === 0) {
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
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="month" />

          <YAxis yAxisId="left" />

          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[-100, 100]}
            tickFormatter={(v) => `${v}%`}
          />

          <Tooltip
            formatter={(value: any, name: any) => {
              if (name === "margin")
                return [`${value}%`, "Margin %"];
              return [formatINR(Number(value)), name];
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
