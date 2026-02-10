"use client";

import { useEffect, useState } from "react";
import BillCard from "@/components/billing/BillCard";
import BillViewModal from "@/components/billing/BillViewModal";
import BillEditModal from "@/components/billing/BillEditModal";
import FloatingAddButton from "@/components/billing/FloatingAddButton";

export default function ViewBills() {
  const [bills, setBills] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(false);

  const [viewBill, setViewBill] = useState<any | null>(null);
  const [editBill, setEditBill] = useState<any | null>(null);

  /* ================= DEBOUNCE SEARCH ================= */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 3 || search.length === 0) {
        setDebouncedSearch(search);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  /* ================= FETCH ================= */
  async function fetchBills(newPage = 1, reset = false) {
    if (loading) return;

    setLoading(true);

    const res = await fetch(
      `/api/bills?page=${newPage}&limit=15&search=${debouncedSearch}&from=${fromDate}&to=${toDate}`
    );

    const data = await res.json();

    if (reset) {
      setBills(data.bills);
    } else {
      setBills((prev) =>
        newPage === 1 ? data.bills : [...prev, ...data.bills]
      );
    }

    setPage(data.currentPage);
    setHasMore(data.currentPage < data.totalPages);
    setLoading(false);
  }

  /* ================= RESET ON FILTER CHANGE ================= */
  useEffect(() => {
    fetchBills(1, true);
  }, [debouncedSearch, fromDate, toDate]);

  /* ================= INFINITE SCROLL ================= */
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 150
      ) {
        if (hasMore && !loading) {
          fetchBills(page + 1);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [page, hasMore, loading]);

  /* ================= DATE PRESETS ================= */
  const setPreset = (type: string) => {
    const today = new Date();
    let from = new Date();

    if (type === "today") {
      from = today;
    }

    if (type === "week") {
      from.setDate(today.getDate() - 7);
    }

    if (type === "month") {
      from.setMonth(today.getMonth() - 1);
    }

    setFromDate(from.toISOString().split("T")[0]);
    setToDate(today.toISOString().split("T")[0]);
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <div className="max-w-3xl mx-auto p-4 space-y-4">

        <h1 className="text-2xl font-bold">Bills</h1>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search name / mobile / city (min 3 chars)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 border rounded-md"
        />

        {/* DATE FILTERS */}
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border p-2 rounded"
          />
        </div>

        {/* PRESETS */}
        <div className="flex gap-2 text-sm">
          <button
            onClick={() => setPreset("today")}
            className="px-3 py-1 bg-blue-100 rounded"
          >
            Today
          </button>

          <button
            onClick={() => setPreset("week")}
            className="px-3 py-1 bg-blue-100 rounded"
          >
            This Week
          </button>

          <button
            onClick={() => setPreset("month")}
            className="px-3 py-1 bg-blue-100 rounded"
          >
            This Month
          </button>
        </div>

        {/* LIST */}
        <div className="space-y-3">
          {bills.map((bill) => (
            <BillCard
              key={bill._id}
              bill={bill}
              onView={() => setViewBill(bill)}
              onEdit={() => setEditBill(bill)}
            />
          ))}
        </div>

        {loading && (
          <p className="text-center text-gray-500">
            Loading...
          </p>
        )}

        {!hasMore && !loading && (
          <p className="text-center text-gray-400 text-sm">
            No more bills
          </p>
        )}
      </div>

      <FloatingAddButton />

      <BillViewModal
        bill={viewBill}
        onClose={() => setViewBill(null)}
      />

      <BillEditModal
        bill={editBill}
        onClose={() => setEditBill(null)}
        onUpdated={() => fetchBills(1, true)}
      />
    </div>
  );
}
