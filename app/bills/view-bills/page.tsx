"use client";

import { useEffect, useState } from "react";
import BillCard from "@/components/billing/BillCard";
import BillViewModal from "@/components/billing/BillViewModal";
import BillEditModal from "@/components/billing/BillEditModal";
import FloatingAddButton from "@/components/billing/FloatingAddButton";
import DailySaleSummary from "@/components/billing/DailySaleSummary";

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

  /* ================= DAILY SALE STATE ================= */
  const [dailySale, setDailySale] = useState<any | null>(null);
  const [closing, setClosing] = useState(false);

  /* ================= FETCH DAILY SALE ================= */
  async function fetchDailySale() {
    try {
      const res = await fetch("/api/daily-sale");

      if (!res.ok) {
        console.error("Failed to fetch daily sale");
        return;
      }

      const data = await res.json();
      setDailySale(data);
    } catch (err) {
      console.error("Daily sale fetch error:", err);
    }
  }

  /* ================= CLOSE DAY ================= */
  async function closeDay() {
    if (!confirm("Are you sure you want to close today?")) return;

    try {
      setClosing(true);

      const res = await fetch("/api/daily-sale/close", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Close failed");
        return;
      }

      alert("Day closed successfully!");

      await fetchDailySale();
      await fetchBills(1, true);
    } catch (err) {
      console.error("Close day error:", err);
      alert("Close failed");
    } finally {
      setClosing(false);
    }
  }

  /* ================= DEBOUNCE SEARCH ================= */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 3 || search.length === 0) {
        setDebouncedSearch(search);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  /* ================= FETCH BILLS ================= */
  async function fetchBills(newPage = 1, reset = false) {
    if (loading) return;

    try {
      setLoading(true);

      const res = await fetch(
        `/api/bills?page=${newPage}&limit=15&search=${debouncedSearch}&from=${fromDate}&to=${toDate}`
      );

      if (!res.ok) {
        console.error("Failed to fetch bills");
        return;
      }

      const data = await res.json();

      if (reset) {
        setBills(data.bills || []);
      } else {
        setBills((prev) =>
          newPage === 1
            ? data.bills || []
            : [...prev, ...(data.bills || [])]
        );
      }

      setPage(data.currentPage || 1);
      setHasMore(data.currentPage < data.totalPages);
    } catch (err) {
      console.error("Fetch bills error:", err);
    } finally {
      setLoading(false);
    }
  }

  /* ================= RESET ON FILTER ================= */
  useEffect(() => {
    fetchBills(1, true);
  }, [debouncedSearch, fromDate, toDate]);

  useEffect(() => {
    fetchDailySale();
  }, []);

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
    return () =>
      window.removeEventListener("scroll", handleScroll);
  }, [page, hasMore, loading]);

  /* ================= DATE PRESETS ================= */
  const setPreset = (type: string) => {
    const today = new Date();
    let from = new Date();

    if (type === "today") from = today;
    if (type === "week") from.setDate(today.getDate() - 7);
    if (type === "month") from.setMonth(today.getMonth() - 1);

    setFromDate(from.toISOString().split("T")[0]);
    setToDate(today.toISOString().split("T")[0]);
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <div className="max-w-3xl mx-auto p-4 space-y-4">

        <h1 className="text-2xl font-bold">Bills</h1>

        {/* ================= DAILY SALE SUMMARY ================= */}
{/* ================= DAILY SALE SUMMARY ================= */}
{dailySale && !dailySale.isClosed && (
  <DailySaleSummary
    dailySale={dailySale}
    closing={closing}
    onCloseDay={closeDay}
  />
)}

        {/* ================= SEARCH ================= */}
        <input
          type="text"
          placeholder="Search name / mobile / city (min 3 chars)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 border rounded-md"
        />

        {/* ================= DATE FILTER ================= */}
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

        {/* ================= BILL LIST ================= */}
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
