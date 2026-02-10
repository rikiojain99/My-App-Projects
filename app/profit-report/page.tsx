"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import QuickStatsBar from "@/components/dashboard/QuickStatsBar";
import PaymentSummary from "@/components/dashboard/PaymentSummary";

export default function ProfitReport() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/reports/profit")
      .then((r) => r.json())
      .then(setData);
  }, []);

  const totalProfit = data.reduce(
    (sum, i) => sum + i.profit,
    0
  );

  return (
    <ProtectedRoute>
<QuickStatsBar />
<PaymentSummary />
      <div className="p-4 md:p-8 bg-white">
        <h1 className="text-xl font-bold mb-4">
          Profit Report
        </h1>

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
                  <td className="border p-2">{i.itemName}</td>
                  <td className="border p-2 text-center">{i.soldQty}</td>
                  <td className="border p-2 text-center">₹{i.revenue}</td>
                  <td className="border p-2 text-center">₹{i.avgCost}</td>
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

        <div className="mt-4 font-bold text-lg">
          Total Profit: ₹{totalProfit.toFixed(2)}
        </div>
      </div>
    </ProtectedRoute>
  );
}
