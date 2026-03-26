"use client";

import Link from "next/link";
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
    const controller = new AbortController();

    fetch("/api/reports/low-stock", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        setItems(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch((error: any) => {
        if (error?.name === "AbortError") return;
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return items;

    return items.filter((item) =>
      item.itemName.toLowerCase().includes(normalizedSearch)
    );
  }, [items, search]);

  const hasSearch = search.trim().length > 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 p-3 pb-24 sm:p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-500"
                >
                  Back
                </Link>
                <h1 className="mt-3 text-2xl font-bold text-slate-900">
                  Low Stock
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Quick mobile view of items that need replenishment.
                </p>
              </div>
              <div className="rounded-2xl bg-red-50 px-3 py-2 text-right">
                <div className="text-xs font-semibold uppercase tracking-wide text-red-500">
                  Total
                </div>
                <div className="text-xl font-bold text-red-600">
                  {items.length}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Showing
                </div>
                <div className="mt-1 text-lg font-bold text-slate-900">
                  {filtered.length}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Search
                </div>
                <div className="mt-1 text-sm font-medium text-slate-900">
                  {hasSearch ? search : "All items"}
                </div>
              </div>
            </div>
          </div>

          <div className="sticky top-0 z-10 rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
            <input
              type="text"
              placeholder="Search low-stock item name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-red-300 focus:bg-white focus:ring-2 focus:ring-red-100"
            />
          </div>

          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-full space-y-3">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                      <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                    </div>
                    <div className="h-8 w-16 animate-pulse rounded-full bg-red-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="text-lg font-semibold text-slate-900">
                {hasSearch ? "No matching low-stock items" : "No low-stock items"}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {hasSearch
                  ? "Try a different item name."
                  : "Everything currently looks stocked."}
              </p>
            </div>
          )}

          <div className="space-y-3 lg:hidden">
            {!loading &&
              filtered.map((item, index) => (
                <div
                  key={item._id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        #{index + 1}
                      </div>
                      <h2 className="mt-1 break-words text-base font-semibold text-slate-900">
                        {item.itemName}
                      </h2>
                      <p className="mt-2 text-sm text-slate-500">
                        Available Qty
                      </p>
                    </div>
                    <div className="shrink-0 rounded-2xl bg-red-50 px-3 py-2 text-center">
                      <div className="text-xs font-semibold uppercase tracking-wide text-red-500">
                        Qty
                      </div>
                      <div className="text-xl font-bold text-red-600">
                        {item.availableQty}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {!loading && filtered.length > 0 && (
            <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Item Name</th>
                    <th className="px-4 py-3 text-center">Available Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, index) => (
                    <tr key={item._id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-500">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {item.itemName}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-red-600">
                        {item.availableQty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
