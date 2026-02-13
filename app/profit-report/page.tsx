"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import QuickStatsBar from "@/components/dashboard/QuickStatsBar";
import PaymentSummary from "@/components/dashboard/PaymentSummary";
import ProfitChart from "@/components/reports/ProfitChart";

export default function ProfitReport() {
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetch("/api/reports/profit")
      .then((r) => r.json())
      .then((res) => {
        setData(res.items || []);
        setSummary(res.summary);
      });
  }, []);

  const totalProfit = data.reduce(
    (sum, i) => sum + i.profit,
    0
  );

  return (
    <ProtectedRoute>
      <QuickStatsBar />
      <PaymentSummary />
      <ProfitChart />

      <div className="p-4 md:p-8 bg-white">
        <h1 className="text-xl font-bold mb-4">
          Profit Report
        </h1>

        {/* ================= SUMMARY CARDS ================= */}

        {summary && (
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <SummaryCard
              label="Revenue"
              value={summary.totalRevenue}
              color="text-blue-600"
            />
            <SummaryCard
              label="Gross Profit"
              value={summary.totalGrossProfit}
              color="text-green-600"
            />
            <SummaryCard
              label="Expenses"
              value={summary.totalExpense}
              color="text-orange-600"
            />
            <SummaryCard
              label="Net Profit"
              value={summary.netProfit}
              color={
                summary.netProfit >= 0
                  ? "text-green-700"
                  : "text-red-600"
              }
            />
          </div>
        )}

        {/* ================= TABLE ================= */}

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
              {data.map((i) => (
                <tr key={i.itemName}>
                  <td className="border p-2">
                    {i.itemName}
                  </td>
                  <td className="border p-2 text-center">
                    {i.soldQty}
                  </td>
                  <td className="border p-2 text-center">
                    ₹{i.revenue}
                  </td>
                  <td className="border p-2 text-center">
                    ₹{i.avgCost}
                  </td>
                  <td
                    className={`border p-2 text-center font-semibold ${
                      i.profit >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    ₹{i.profit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* OLD TOTAL (kept as requested) */}
        <div className="mt-4 font-bold text-lg">
          Total Gross Profit: ₹{totalProfit.toFixed(2)}
        </div>

        {/* NEW NET DISPLAY */}
        {summary && (
          <div className="mt-2 text-lg font-bold">
            Net Profit After Expenses: ₹
            {summary.netProfit}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

/* ================= SMALL COMPONENT ================= */

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-gray-50 border rounded-lg p-4">
      <div className="text-sm text-gray-500">
        {label}
      </div>
      <div className={`text-lg font-bold ${color}`}>
        ₹ {value}
      </div>
    </div>
  );
}
