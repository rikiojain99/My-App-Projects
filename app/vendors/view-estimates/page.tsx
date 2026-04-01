"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import SaveStatusPopup, {
  type SavePopupStatus,
} from "@/components/ui/SaveStatusPopup";
import VendorSaleCard from "@/components/vendor/VendorSaleCard";
import VendorSaleViewModal from "@/components/vendor/VendorSaleViewModal";

type VendorSaleItem = {
  name: string;
  qty: number;
  rate: number;
  total: number;
};

type VendorSale = {
  _id: string;
  vendor: {
    _id: string;
    name: string;
    mobile: string;
    city: string;
  };
  items: VendorSaleItem[];
  deliveredBy: string;
  grandTotal: number;
  discount: number;
  finalTotal: number;
  paymentType: "paid" | "credit";
  paymentMethod: "cash" | "upi" | "split" | null;
  oldBalance: number;
  newBalance: number;
  cashAmount: number;
  upiAmount: number;
  creditAmount: number;
  createdAt: string;
};

export default function ViewVendorEstimatesPage() {
  return (
    <Suspense fallback={<ViewVendorEstimatesFallback />}>
      <ViewVendorEstimatesContent />
    </Suspense>
  );
}

function ViewVendorEstimatesContent() {
  const searchParams = useSearchParams();
  const vendorId = useMemo(
    () => searchParams.get("vendorId")?.trim() || "",
    [searchParams]
  );
  const vendorName = useMemo(
    () => searchParams.get("vendorName")?.trim() || "",
    [searchParams]
  );

  const [sales, setSales] = useState<VendorSale[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filteredSummary, setFilteredSummary] = useState({
    totalSales: 0,
    totalAmount: 0,
  });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewSale, setViewSale] = useState<VendorSale | null>(null);
  const [popup, setPopup] = useState<{
    open: boolean;
    status: SavePopupStatus;
    title: string;
    message: string;
  }>({
    open: false,
    status: "saving",
    title: "",
    message: "",
  });

  const salesAbortRef = useRef<AbortController | null>(null);
  const salesReqIdRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 3 || search.length === 0) {
        setDebouncedSearch(search.trim());
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const formatINR = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value || 0);

  async function fetchSales(newPage = 1, reset = false) {
    if (loading && !reset) return;

    if (reset && salesAbortRef.current) {
      salesAbortRef.current.abort();
    }

    const controller = new AbortController();
    const requestId = ++salesReqIdRef.current;

    if (reset) {
      salesAbortRef.current = controller;
    }

    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(newPage),
        limit: "15",
        search: debouncedSearch,
        from: fromDate,
        to: toDate,
      });

      if (vendorId) {
        params.set("vendorId", vendorId);
      }

      const res = await fetch(`/api/vendor-sale?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        setPopup({
          open: true,
          status: "error",
          title: "Load failed",
          message: "Failed to fetch vendor estimates.",
        });
        return;
      }

      const data = await res.json();
      if (requestId !== salesReqIdRef.current) return;

      const nextSales = Array.isArray(data?.sales) ? data.sales : [];

      if (reset) {
        setSales(nextSales);
      } else {
        setSales((current) =>
          newPage === 1 ? nextSales : [...current, ...nextSales]
        );
      }

      setPage(Number(data?.currentPage || 1));
      setHasMore(Number(data?.currentPage || 1) < Number(data?.totalPages || 1));
      setFilteredSummary({
        totalSales: Number(data?.totalSales || 0),
        totalAmount: Number(data?.totalAmount || 0),
      });
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;

      setPopup({
        open: true,
        status: "error",
        title: "Load failed",
        message: "Unable to load vendor estimates right now.",
      });
    } finally {
      if (
        requestId === salesReqIdRef.current &&
        !controller.signal.aborted
      ) {
        setLoading(false);
      }

      if (reset && salesAbortRef.current === controller) {
        salesAbortRef.current = null;
      }
    }
  }

  useEffect(() => {
    fetchSales(1, true);
  }, [debouncedSearch, fromDate, toDate, vendorId]);

  useEffect(() => {
    return () => {
      if (salesAbortRef.current) {
        salesAbortRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 150
      ) {
        if (hasMore && !loading) {
          fetchSales(page + 1);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [page, hasMore, loading, debouncedSearch, fromDate, toDate, vendorId]);

  const setPreset = (type: "today" | "week" | "month") => {
    const today = new Date();
    const from = new Date();

    if (type === "week") from.setDate(today.getDate() - 7);
    if (type === "month") from.setMonth(today.getMonth() - 1);

    setFromDate(from.toISOString().split("T")[0]);
    setToDate(today.toISOString().split("T")[0]);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 pb-24">
        <div className="mx-auto max-w-4xl space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900">
                Vendor Estimates
              </h1>
              {/* <p className="text-sm text-gray-500">
                Browse vendor-wise estimate history with filters.
              </p> */}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/billing"
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                New Estimate
              </Link>
              <button
                type="button"
                onClick={() => setShowFilters((current) => !current)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
            </div>
          </div>

          {vendorId && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
              <span className="font-medium">
                Viewing estimates for {vendorName || "selected vendor"}
              </span>
              <Link
                href="/vendors/view-estimates"
                className="rounded-full border border-blue-300 bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              >
                Clear vendor filter
              </Link>
            </div>
          )}

          {showFilters && (
            <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <input
                type="text"
                placeholder="Search vendor, mobile, city, item or delivered by"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-md border border-gray-300 p-3 text-sm"
              />

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="rounded-md border border-gray-300 p-2.5 text-sm"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  className="rounded-md border border-gray-300 p-2.5 text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => setPreset("today")}
                  className="rounded-full bg-blue-100 px-3 py-1.5 font-medium text-blue-700"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setPreset("week")}
                  className="rounded-full bg-blue-100 px-3 py-1.5 font-medium text-blue-700"
                >
                  This Week
                </button>
                <button
                  type="button"
                  onClick={() => setPreset("month")}
                  className="rounded-full bg-blue-100 px-3 py-1.5 font-medium text-blue-700"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                  className="rounded-full bg-gray-100 px-3 py-1.5 font-medium text-gray-700"
                >
                  Clear Dates
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Filtered Estimates</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {filteredSummary.totalSales}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Filtered Amount</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {formatINR(filteredSummary.totalAmount)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {sales.map((sale) => (
              <VendorSaleCard
                key={sale._id}
                sale={sale}
                onView={() => setViewSale(sale)}
              />
            ))}
          </div>

          {loading && (
            <p className="text-center text-sm text-gray-500">Loading...</p>
          )}

          {!loading && sales.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
              No vendor estimates found for the current filters.
            </div>
          )}

          {!hasMore && sales.length > 0 && !loading && (
            <p className="text-center text-sm text-gray-400">
              No more vendor estimates
            </p>
          )}
        </div>

        <VendorSaleViewModal
          sale={viewSale}
          onClose={() => setViewSale(null)}
        />

        <SaveStatusPopup
          open={popup.open}
          status={popup.status}
          title={popup.title}
          message={popup.message}
          onClose={() => setPopup((current) => ({ ...current, open: false }))}
        />
      </div>
    </ProtectedRoute>
  );
}

function ViewVendorEstimatesFallback() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 pb-24">
        <div className="mx-auto max-w-4xl space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900">
                Vendor Estimates
              </h1>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
            Loading vendor estimates...
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
