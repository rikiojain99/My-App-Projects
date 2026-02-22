"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

interface InventoryItem {
  _id: string;
  shop: number;
  name: string;
  type: string;
  cty: string;
  qty: number;
  rate: number;
}

export default function ViewInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterName, setFilterName] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch("/api/inventory");
        if (res.ok) {
          const data: InventoryItem[] = await res.json();
          setInventory(data);
        } else {
          console.error("Failed to fetch inventory:", res.status);
        }
      } catch (err) {
        console.error("Error fetching inventory:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const itemName = (item.name || "").toLowerCase();
      const searchLower = search.toLowerCase();
      const matchesSearch = itemName.includes(searchLower);
      const matchesName = filterName === "all" || itemName === filterName.toLowerCase();
      const matchesType = filterType === "all" || (item.type || "") === filterType;

      return matchesSearch && matchesName && matchesType;
    });
  }, [inventory, search, filterName, filterType]);

  const names = Array.from(new Set(inventory.map((i) => (i.name || "").toLowerCase())));
  const types = Array.from(new Set(inventory.map((i) => i.type || "")));

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

        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border rounded flex-1 text-black"
          />

          <select
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="all">All Items</option>
            {names.map((name) => (
              <option key={name} value={name}>
                {name}
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

        {filteredInventory.length === 0 ? (
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
                {filteredInventory.map((item) => (
                  <tr key={item._id}>
                    <td className="border px-2 py-1 text-center">{item.shop}</td>
                    <td className="border px-2 py-1">{item.name}</td>
                    <td className="border px-2 py-1">{item.type}</td>
                    <td className="border px-2 py-1">{item.cty}</td>
                    <td className="border px-2 py-1 text-center">{item.qty}</td>
                    <td className="border px-2 py-1 text-center">{item.rate}</td>
                    <td className="border px-2 py-1 text-center">{(item.qty || 0) * (item.rate || 0)}</td>
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
