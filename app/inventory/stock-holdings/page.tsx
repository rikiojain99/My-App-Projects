"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

type StockItem = {
  _id: string;
  itemName: string;
  availableQty: number;
};

export default function StockHoldings() {
  const [data, setData] = useState<StockItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = async (q = "") => {
    setLoading(true);
    const res = await fetch(`/api/stock-holdings?search=${q}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <ProtectedRoute>
      <div className="p-4 md:p-8 text-black bg-white min-h-screen">
        <h1 className="text-xl font-bold mb-4 text-black">
          Stock Holdings
        </h1>

        {/* SEARCH */}
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            fetchData(e.target.value);
          }}
          placeholder="Search item name..."
          className="w-full max-w-md p-2 mb-4 border rounded text-black"
        />

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Item Name</th>
                <th className="border p-2 text-center">
                  Available Qty
                </th>
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

              {!loading && data.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-4 text-center">
                    No stock found
                  </td>
                </tr>
              )}

              {data.map((item) => (
                <tr key={item._id}>
                  <td className="border p-2">{item.itemName}</td>
                  <td className="border p-2 text-center">
                    {item.availableQty}
                  </td>
                  <td className="border p-2 text-center">
                    {item.availableQty <= 5 ? (
                      <span className="text-red-600 font-semibold">
                        Low
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
