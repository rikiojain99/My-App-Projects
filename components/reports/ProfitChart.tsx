"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type ProfitPoint = {
  month: string;
  revenue: number;
  expense: number;
  profit: number;
  margin: number;
};

type PieDatum = {
  name: string;
  value: number;
  color: string;
};

export default function ProfitChart({
  data = [],
}: {
  data?: ProfitPoint[];
}) {
  const chartData = Array.isArray(data) ? data : [];

  const totals = chartData.reduce(
    (acc, point) => ({
      revenue: acc.revenue + (Number(point.revenue) || 0),
      expense: acc.expense + (Number(point.expense) || 0),
      profit: acc.profit + (Number(point.profit) || 0),
    }),
    { revenue: 0, expense: 0, profit: 0 }
  );

  const pieData: PieDatum[] = [
    {
      name: "Revenue",
      value: Math.max(totals.revenue, 0),
      color: "#10b981",
    },
    {
      name: "Expense",
      value: Math.max(totals.expense, 0),
      color: "#ef4444",
    },
    {
      name: totals.profit >= 0 ? "Net Profit" : "Net Loss",
      value: Math.abs(totals.profit),
      color: totals.profit >= 0 ? "#2563eb" : "#f59e0b",
    },
  ].filter((slice) => slice.value > 0);

  const formatINR = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value || 0);

  if (pieData.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        No data available
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 shadow-sm">
      <div className="border-b border-slate-200 px-4 py-4 md:px-6">
        <h3 className="text-base font-semibold text-slate-900">
          Profit Distribution
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Revenue vs expense vs final outcome
        </p>
      </div>

      <div className="grid gap-3 px-4 py-3 text-xs md:grid-cols-3 md:px-6">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-emerald-700">
          Revenue: {formatINR(totals.revenue)}
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-rose-700">
          Expense: {formatINR(totals.expense)}
        </div>
        <div
          className={`rounded-lg px-2.5 py-1.5 ${
            totals.profit >= 0
              ? "border border-blue-200 bg-blue-50 text-blue-700"
              : "border border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {totals.profit >= 0 ? "Net Profit" : "Net Loss"}:{" "}
          {formatINR(Math.abs(totals.profit))}
        </div>
      </div>

      <div className="h-[390px] px-2 pb-4 md:px-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={120}
              paddingAngle={3}
              stroke="#ffffff"
              strokeWidth={2}
              label={({ name, percent = 0 }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>

            <Tooltip
              formatter={(value, name) => {
                const safeValue = Number(value ?? 0);
                return [formatINR(safeValue), String(name)];
              }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #cbd5e1",
                boxShadow:
                  "0 10px 30px rgba(15, 23, 42, 0.10)",
              }}
              labelStyle={{ color: "#0f172a", fontWeight: 600 }}
            />

            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{ fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
