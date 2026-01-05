"use client";
import { useEffect, useState, useMemo } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

interface InventryItem {
  _id: string;
  shop: number;
  name: string;
  type: string;
  cty: string;
  qty: number;
  rate: number;
}

export default function ViewInventry() {
  const [inventry, setInventry] = useState<InventryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterShop, setFilterShop] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  // Fetch inventory data
  useEffect(() => {
    const fetchInventry = async () => {
      try {
        const res = await fetch("/api/inventry");
        if (res.ok) {
          const data: InventryItem[] = await res.json();
          setInventry(data);
        }
      } catch (err) {
        console.error("Error fetching inventry:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInventry();
  }, []);

  // Filtered results
  const filteredInventry = useMemo(() => {
    return inventry.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesShop = filterShop === "all" || item.shop.toString() === filterShop;
      const matchesType = filterType === "all" || item.type === filterType;
      return matchesSearch && matchesShop && matchesType;
    });
  }, [inventry, search, filterShop, filterType]);

  // Unique shops and types for filter dropdowns
  const shops = Array.from(new Set(inventry.map((i) => i.shop.toString())));
  const types = Array.from(new Set(inventry.map((i) => i.type)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-black">Loading inventory...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="p-4 md:p-10 m-4 md:m-10 max-w-full bg-white text-black border rounded-lg">
        <h1 className="text-xl font-bold mb-4">Inventory</h1>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border rounded flex-1 text-black"
          />
          <select
            value={filterShop}
            onChange={(e) => setFilterShop(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="all">All Shops</option>
            {shops.map((shop) => (
              <option key={shop} value={shop}>
                Shop {shop}
              </option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="all">All Types</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        {filteredInventry.length === 0 ? (
          <p>No items found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse border border-gray-300 text-sm md:text-base">
              <thead>
                <tr className="bg-gray-200 text-black">
                  <th className="border px-2 py-1">Shop</th>
                  <th className="border px-2 py-1">Name</th>
                  <th className="border px-2 py-1">Type</th>
                  <th className="border px-2 py-1">Cty</th>
                  <th className="border px-2 py-1">Qty</th>
                  <th className="border px-2 py-1">Rate</th>
                  <th className="border px-2 py-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventry.map((item) => (
                  <tr key={item._id}>
                    <td className="border px-2 py-1 text-center">{item.shop}</td>
                    <td className="border px-2 py-1">{item.name}</td>
                    <td className="border px-2 py-1">{item.type}</td>
                    <td className="border px-2 py-1">{item.cty}</td>
                    <td className="border px-2 py-1 text-center">{item.qty}</td>
                    <td className="border px-2 py-1 text-center">{item.rate}</td>
                    <td className="border px-2 py-1 text-center">{item.qty * item.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
