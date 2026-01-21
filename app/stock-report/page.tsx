"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function StockReport() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/reports/stock")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <ProtectedRoute>
      <div className="p-4 md:p-8 bg-white text-black">
        <h1 className="text-xl font-bold mb-4">Stock Report</h1>

        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Item</th>
                <th className="border p-2">Available</th>
                <th className="border p-2">Purchased</th>
                <th className="border p-2">Sold</th>
                <th className="border p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((i) => (
                <tr key={i.itemName}>
                  <td className="border p-2">{i.itemName}</td>
                  <td className="border p-2 text-center">
                    {i.availableQty}
                  </td>
                  <td className="border p-2 text-center">
                    {i.totalPurchased}
                  </td>
                  <td className="border p-2 text-center">
                    {i.totalSold}
                  </td>
                  <td className="border p-2 text-center">
                    {i.lowStock ? (
                      <span className="text-red-600 font-semibold">
                        LOW
                      </span>
                    ) : (
                      <span className="text-green-600 font-semibold">
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ProtectedRoute>
  );
}
