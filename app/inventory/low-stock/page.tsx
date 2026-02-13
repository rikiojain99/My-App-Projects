"use client";

import { useEffect, useMemo, useState } from "react";
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
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return items.filter((i) =>
      i.itemName.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        {/* HEADER */}
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h1 className="text-2xl font-bold text-black">
              ⚠️ Low Stock Items
            </h1>

            <div className="text-sm text-gray-600">
              Total Low Stock:{" "}
              <span className="font-semibold text-red-600">
                {items.length}
              </span>
            </div>
          </div>

          {/* SEARCH */}
          <div className="sticky top-16 z-10 bg-gray-50 pb-2">
            <input
              type="text"
              placeholder="Search item name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-md p-3 border rounded-lg bg-white"
            />
          </div>

          {/* CONTENT */}
          {loading && (
            <div className="text-center py-10 text-gray-500">
              Loading low stock items…
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-10 text-green-600 font-medium">
              🎉 No low stock items
            </div>
          )}

          {/* MOBILE CARD VIEW */}
          <div className="grid gap-3 md:hidden">
            {filtered.map((item) => (
              <div
                key={item._id}
                className="bg-white border rounded-xl p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-black">
                    {item.itemName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Available Qty:{" "}
                    <span className="font-bold text-red-600">
                      {item.availableQty}
                    </span>
                  </p>
                </div>

                <span className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-700 font-semibold">
                  LOW
                </span>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto bg-white border rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-3 text-left">Item Name</th>
                  <th className="p-3 text-center">Available Qty</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item._id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-3 font-medium text-black">
                      {item.itemName}
                    </td>

                    <td className="p-3 text-center font-semibold text-red-600">
                      {item.availableQty}
                    </td>

                    <td className="p-3 text-center">
                      <span className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-700 font-semibold">
                        LOW
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
