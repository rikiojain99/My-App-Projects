"use client";
import { useEffect, useMemo, useState } from "react";

/* ---------------- TYPES ---------------- */
type StockItem = {
  name: string;
  qty: number;
  rate: number;
  total: number;
};

type Stock = {
  _id: string;
  vendorName: string;
  purchaseDate: string;
  items: StockItem[];
  grandTotal: number;
};

/* ===================================================== */

export default function StockView() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [vendorFilter, setVendorFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);
  const [loading, setLoading] = useState(true);
  const [showVendorSuggestions, setShowVendorSuggestions] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);

  /* ================= FETCH ================= */
  useEffect(() => {
    fetch("/api/stock")
      .then((res) => res.json())
      .then((data) => {
        setStocks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /* ================= UNIQUE VENDORS ================= */
  const vendors = useMemo(() => {
    const map = new Map<string, string>();
    stocks.forEach((s) => {
      const normalized = s.vendorName.trim().toLowerCase();
      if (!map.has(normalized)) {
        map.set(normalized, s.vendorName.trim());
      }
    });
    return Array.from(map.values());
  }, [stocks]);

  /* ================= VENDOR SUMMARY ================= */
  const vendorSummary = useMemo(() => {
    const map: Record<string, number> = {};

    stocks.forEach((s) => {
      map[s.vendorName] =
        (map[s.vendorName] || 0) + s.grandTotal;
    });

    return Object.entries(map).sort(
      (a, b) => b[1] - a[1]
    );
  }, [stocks]);

  /* ================= FILTER LOGIC ================= */
  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      const vendorMatch = vendorFilter
        ? stock.vendorName
            .toLowerCase()
            .includes(vendorFilter.toLowerCase())
        : true;

      const dateMatch = dateFilter
        ? new Date(stock.purchaseDate)
            .toISOString()
            .slice(0, 10) === dateFilter
        : true;

      const monthMatch = monthFilter
        ? new Date(stock.purchaseDate)
            .toISOString()
            .slice(0, 7) === monthFilter
        : true;

      return vendorMatch && dateMatch && monthMatch;
    });
  }, [stocks, vendorFilter, dateFilter, monthFilter]);

  /* ================= TOTALS ================= */
  const totalAmount = useMemo(() => {
    return filteredStocks.reduce(
      (sum, s) => sum + s.grandTotal,
      0
    );
  }, [filteredStocks]);

  const monthTotal = useMemo(() => {
    if (!monthFilter) return 0;
    return filteredStocks.reduce(
      (sum, s) => sum + s.grandTotal,
      0
    );
  }, [filteredStocks, monthFilter]);

  /* ================= INFINITE SCROLL ================= */
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 200
      ) {
        setVisibleCount((prev) =>
          prev < filteredStocks.length
            ? prev + 20
            : prev
        );
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () =>
      window.removeEventListener("scroll", handleScroll);
  }, [filteredStocks.length]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const clearFilters = () => {
    setVendorFilter("");
    setDateFilter("");
    setMonthFilter("");
    setVisibleCount(20);
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">
        Loading stock data...
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">

      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Stock History
        </h1>

        <button
          onClick={() =>
            setFiltersOpen(!filtersOpen)
          }
          className="text-sm px-3 py-1 bg-gray-200 rounded-lg"
        >
          {filtersOpen
            ? "Hide Filters"
            : "Show Filters"}
        </button>
      </div>

      {/* ================= VENDOR SUMMARY ROW ================= */}
      {vendorSummary.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-600">
            Vendor Summary
          </h2>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {vendorSummary.map(
              ([vendor, total]) => {
                const active =
                  vendorFilter.toLowerCase() ===
                  vendor.toLowerCase();

                return (
                  <div
                    key={vendor}
                    onClick={() =>
                      setVendorFilter(vendor)
                    }
                    className={`min-w-\[180px] cursor-pointer rounded-xl border p-4 transition
                    ${
                      active
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-white hover:shadow-md"
                    }`}
                  >
                    <div className="text-sm truncate">
                      {vendor}
                    </div>

                    <div className="font-semibold text-lg mt-1">
                      ₹ {total}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* ================= SUMMARY CARDS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Entries"
          value={filteredStocks.length}
        />
        <SummaryCard
          label="Total Value"
          value={totalAmount}
        />
        {monthFilter && (
          <SummaryCard
            label={`Month (${monthFilter})`}
            value={monthTotal}
          />
        )}
      </div>

      {/* ================= FILTER BAR ================= */}
      {filtersOpen && (
        <div className="bg-gray-50 border rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">

            <div className="relative">
              <input
                type="text"
                placeholder="Search Vendor"
                value={vendorFilter}
                onChange={(e) => {
                  setVendorFilter(e.target.value);
                  setShowVendorSuggestions(true);
                }}
                onBlur={() =>
                  setTimeout(
                    () =>
                      setShowVendorSuggestions(false),
                    200
                  )
                }
                className="p-2 border rounded-lg w-full"
              />

              {showVendorSuggestions &&
                vendorFilter && (
                  <div className="absolute z-20 bg-white border rounded-lg w-full max-h-40 overflow-y-auto shadow">
                    {vendors
                      .filter((v) =>
                        v
                          .toLowerCase()
                          .includes(
                            vendorFilter.toLowerCase()
                          )
                      )
                      .map((v) => (
                        <div
                          key={v}
                          onClick={() => {
                            setVendorFilter(v);
                            setShowVendorSuggestions(false);
                          }}
                          className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                        >
                          {v}
                        </div>
                      ))}
                  </div>
                )}
            </div>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(e.target.value)
              }
              className="p-2 border rounded-lg"
            />

            <input
              type="month"
              value={monthFilter}
              onChange={(e) =>
                setMonthFilter(e.target.value)
              }
              className="p-2 border rounded-lg"
            />

            <div className="flex items-center font-semibold">
              Total: ₹ {totalAmount}
            </div>

            <button
              onClick={clearFilters}
              className="bg-gray-200 hover:bg-gray-300 transition px-3 py-2 rounded-lg"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ================= STOCK LIST ================= */}
      <div className="space-y-3">
        {filteredStocks
          .slice(0, visibleCount)
          .map((stock) => (
            <div
              key={stock._id}
              className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">
                    {stock.vendorName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(
                      stock.purchaseDate
                    ).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="font-bold text-lg">
                    ₹ {stock.grandTotal}
                  </div>

                  <button
                    onClick={() =>
                      toggleExpand(stock._id)
                    }
                    className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100 transition"
                  >
                    <span
                      className={`transition-transform duration-300 ${
                        expanded[stock._id]
                          ? "rotate-180"
                          : ""
                      }`}
                    >
                      ▼
                    </span>
                  </button>
                </div>
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  expanded[stock._id]
                    ? "max-h-96 mt-4 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="space-y-2 text-sm">
                  {stock.items.map(
                    (item, i) => (
                      <div
                        key={i}
                        className="flex justify-between border-b pb-1 last:border-none"
                      >
                        <div>
                          {item.name}
                          <span className="text-xs text-gray-500 ml-2">
                            × {item.qty}
                          </span>
                        </div>
                        <div>
                          ₹ {item.total}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ================= SMALL COMPONENT ================= */

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <div className="text-sm text-gray-500">
        {label}
      </div>
      <div className="text-xl font-semibold mt-1">
        ₹ {value}
      </div>
    </div>
  );
}
