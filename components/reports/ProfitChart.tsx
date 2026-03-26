"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ProfitPoint = {
  month: string;
  revenue: number;
  expense: number;
  profit: number;
  margin: number;
};

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);

const compactINR = (value: number) => {
  const abs = Math.abs(value || 0);

  if (abs >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(roundMoney(value || 0));
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
      marginTotal: acc.marginTotal + (Number(point.margin) || 0),
    }),
    { revenue: 0, expense: 0, profit: 0, marginTotal: 0 }
  );

  const averageMargin =
    chartData.length > 0
      ? roundMoney(totals.marginTotal / chartData.length)
      : totals.revenue > 0
        ? roundMoney((totals.profit / totals.revenue) * 100)
        : 0;

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        No data available for the selected period.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl `bg-gradient-to-b` from-white to-slate-50">
      <div className="border-b border-slate-200 px-4 py-4 md:px-6">
        <h3 className="text-base font-semibold text-slate-900">
          Monthly Profit Trend
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Revenue, total cost, and net result by month.
        </p>
      </div>

      <div className="grid gap-3 px-4 py-3 text-xs md:grid-cols-4 md:px-6">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
          Revenue: {formatINR(totals.revenue)}
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
          Total Cost: {formatINR(totals.expense)}
        </div>
        <div
          className={`rounded-lg px-3 py-2 ${
            totals.profit >= 0
              ? "border border-blue-200 bg-blue-50 text-blue-700"
              : "border border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {totals.profit >= 0 ? "Net Profit" : "Net Loss"}: {formatINR(Math.abs(totals.profit))}
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-slate-700">
          Avg Margin: {averageMargin.toFixed(1)}%
        </div>
      </div>

      <div className=".h-\[360px\] px-2 pb-4 md:h-\[400px\] md:px-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
            barGap={8}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#475569" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#475569" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={compactINR}
            />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
            <Tooltip
              formatter={(value, name) => [formatINR(Number(value ?? 0)), String(name)]}
              labelFormatter={(label) => `Month: ${label}`}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #cbd5e1",
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.10)",
              }}
              labelStyle={{ color: "#0f172a", fontWeight: 600 }}
            />
            <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
            <Bar dataKey="expense" name="Total Cost" fill="#ef4444" radius={[8, 8, 0, 0]} />
            <Bar dataKey="profit" name="Net Result" fill="#2563eb" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
