"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function MonthlyBarChart({
  stocks,
}: any) {
  const data = Object.values(
    stocks.reduce((acc: any, s: any) => {
      const month = new Date(
        s.purchaseDate
      ).toISOString().slice(0, 7);

      acc[month] = acc[month] || {
        month,
        total: 0,
      };

      acc[month].total += s.grandTotal;

      return acc;
    }, {})
  );

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <h3 className="font-semibold mb-3">
        Monthly Expenses
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
