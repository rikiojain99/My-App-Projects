"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

type StockRow = {
  itemName: string;
  availableQty: number;
  avgCost: number;
  lastPurchaseRate: number;
  stockValue: number;
};

export default function AvailableStock() {
  const [data, setData] = useState<StockRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/available-stock")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    return data.filter((item) =>
      item.itemName
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [data, search]);

  /* ================= TOTAL VALUE ================= */
  const totalStockValue = useMemo(() => {
    return filtered.reduce(
      (sum, i) => sum + i.stockValue,
      0
    );
  }, [filtered]);

  return (
    <ProtectedRoute>
      <div className="p-4 max-w-6xl mx-auto space-y-6">

        <h1 className="text-2xl font-bold">
          Available Stock
        </h1>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search item..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 border rounded-lg w-full max-w-md"
        />

        {/* SUMMARY */}
        <div className="bg-blue-50 border rounded-xl p-4">
          <div className="text-sm text-gray-600">
            Total Stock Value
          </div>
          <div className="text-xl font-semibold">
            ₹ {totalStockValue.toFixed(2)}
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto bg-white border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="p-3 text-left">Item</th>
                <th className="p-3 text-center">Available</th>
                <th className="p-3 text-center">Avg Cost</th>
                <th className="p-3 text-center">Last Purchase</th>
                <th className="p-3 text-right">Stock Value</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="p-4 text-center">
                    Loading...
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center">
                    No items found
                  </td>
                </tr>
              )}

              {filtered.map((row) => {
                const low =
                  row.availableQty <= 5;

                return (
                  <tr
                    key={row.itemName}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-3 font-medium">
                      {row.itemName}
                    </td>

                    <td
                      className={`p-3 text-center font-semibold ${
                        low
                          ? "text-red-600"
                          : ""
                      }`}
                    >
                      {row.availableQty}
                    </td>

                    <td className="p-3 text-center">
                      ₹ {row.avgCost}
                    </td>

                    <td className="p-3 text-center">
                      ₹ {row.lastPurchaseRate}
                    </td>

                    <td className="p-3 text-right font-semibold">
                      ₹{" "}
                      {row.stockValue.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ProtectedRoute>
  );
}
