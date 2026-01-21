"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

type LowStockItem = {
  _id: string;
  itemName: string;
  availableQty: number;
};

export default function LowStockPage() {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/low-stock")
      .then((r) => r.json())
      .then((d) => {
        setItems(d);
        setLoading(false);
      });
  }, []);

  const filtered = items.filter((i) =>
    i.itemName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <div className="p-4 md:p-8 bg-white min-h-screen text-black">
        <h1 className="text-xl font-bold mb-4 text-black">
          Low Stock Items
        </h1>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search item..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md p-2 mb-4 border rounded text-black"
        />

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Item Name</th>
                <th className="border p-2 text-center">Available Qty</th>
                <th className="border p-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={3} className="p-4 text-center">
                    Loading...
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-4 text-center">
                    No low stock items 🎉
                  </td>
                </tr>
              )}

              {filtered.map((item) => (
                <tr key={item._id}>
                  <td className="border p-2">{item.itemName}</td>
                  <td className="border p-2 text-center">
                    {item.availableQty}
                  </td>
                  <td className="border p-2 text-center">
                    <span className="text-red-600 font-semibold">
                      LOW
                    </span>
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
