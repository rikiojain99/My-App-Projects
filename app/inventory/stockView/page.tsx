"use client";
import { useEffect, useMemo, useState } from "react";

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

export default function StockView() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [vendorFilter, setVendorFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);
  const [loading, setLoading] = useState(true);
  const [showVendorSuggestions, setShowVendorSuggestions] = useState(false);

  useEffect(() => {
    fetch("/api/stock")
      .then((res) => res.json())
      .then((data) => {
        setStocks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ---------------- UNIQUE VENDORS ----------------
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

  // ---------------- FILTER LOGIC (UNCHANGED CORE) ----------------
  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      const vendorMatch = vendorFilter
        ? stock.vendorName.toLowerCase().includes(vendorFilter.toLowerCase())
        : true;

      const dateMatch = dateFilter
        ? new Date(stock.purchaseDate).toISOString().slice(0, 10) === dateFilter
        : true;

      const monthMatch = monthFilter
        ? new Date(stock.purchaseDate).toISOString().slice(0, 7) === monthFilter
        : true;

      return vendorMatch && dateMatch && monthMatch;
    });
  }, [stocks, vendorFilter, dateFilter, monthFilter]);

  // ---------------- TOTAL CALC ----------------
  const totalAmount = useMemo(() => {
    return filteredStocks.reduce((sum, s) => sum + s.grandTotal, 0);
  }, [filteredStocks]);

  // ---------------- MONTH TOTAL ----------------
  const monthTotal = useMemo(() => {
    if (!monthFilter) return 0;
    return filteredStocks.reduce((sum, s) => sum + s.grandTotal, 0);
  }, [filteredStocks, monthFilter]);

  // ---------------- VENDOR SUMMARY ----------------
  const vendorSummary = useMemo(() => {
    const map: Record<string, number> = {};
    stocks.forEach((s) => {
      map[s.vendorName] = (map[s.vendorName] || 0) + s.grandTotal;
    });
    return map;
  }, [stocks]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const clearFilters = () => {
    setVendorFilter("");
    setDateFilter("");
    setMonthFilter("");
    setVisibleCount(20);
  };

  if (loading) {
    return (
      <div className="p-5 text-center text-black dark:text-white">
        Loading stock data...
      </div>
    );
  }

  return (
    <div className="p-5 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold mb-4 text-black dark:text-white">
        Stock History
      </h1>

      {/* -------- VENDOR SUMMARY CARDS -------- 
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {Object.entries(vendorSummary).map(([vendor, total]) => (
          <div
            key={vendor}
            onClick={() => setVendorFilter(vendor)}
            className="cursor-pointer p-3 rounded border bg-white dark:bg-gray-900"
          >
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {vendor}
            </div>
            <div className="font-bold text-black dark:text-white">
              ₹ {total}
            </div>
          </div>
        ))}
      </div>

      {/* -------- FILTER BAR -------- */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4 relative">
        {/* Vendor with suggestions */}
        <div className="relative text-black">
          <input
            type="text"
            placeholder="Search Vendor"
            value={vendorFilter}
            onChange={(e) => {
              setVendorFilter(e.target.value);
              setShowVendorSuggestions(true);
            }}
            onBlur={() => setTimeout(() => setShowVendorSuggestions(false), 200)}
            className="p-2 border rounded w-full text-black"
          />
          {showVendorSuggestions && vendorFilter && (
            <div className="absolute z-10 bg-white border rounded w-full max-h-40 overflow-y-auto">
              {vendors
                .filter((v) =>
                  v.toLowerCase().includes(vendorFilter.toLowerCase())
                )
                .map((v) => (
                  <div
                    key={v}
                    onClick={() => {
                      setVendorFilter(v);
                      setShowVendorSuggestions(false);
                    }}
                    className="px-2 py-1 cursor-pointer hover:bg-gray-100"
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
          onChange={(e) => setDateFilter(e.target.value)}
          className="p-2 border rounded text-black"
        />

        <input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="p-2 border rounded text-black"
        />

        <div className="flex items-center font-semibold text-black dark:text-white">
          Total: ₹ {totalAmount}
        </div>

        <button
          onClick={clearFilters}
          className="bg-gray-300 px-3 py-2 rounded"
        >
          Clear Filters
        </button>
      </div>

      {/* -------- MONTH SUMMARY -------- */}
      {monthFilter && (
        <div className="mb-4 font-semibold text-black dark:text-white">
          Total for {monthFilter}: ₹ {monthTotal}
        </div>
      )}

      {/* -------- STOCK LIST -------- */}
      {filteredStocks.slice(0, visibleCount).map((stock) => (
        <div
          key={stock._id}
          className="border rounded mb-3 p-3 bg-white dark:bg-gray-900"
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="font-semibold text-black dark:text-white">
                {stock.vendorName}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {new Date(stock.purchaseDate).toLocaleDateString()}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="font-bold text-black dark:text-white">
                ₹ {stock.grandTotal}
              </div>
              <button
                onClick={() => toggleExpand(stock._id)}
                className="text-blue-600 text-4xl"
              >
                {expanded[stock._id] ? "−" : "+"}
              </button>
            </div>
          </div>

          {expanded[stock._id] && (
            <div className="mt-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left">Item</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Rate</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.items.map((item, i) => (
                    <tr key={i} className="border-b last:border-none">
                      <td>{item.name}</td>
                      <td className="text-right">{item.qty}</td>
                      <td className="text-right">{item.rate}</td>
                      <td className="text-right">{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {visibleCount < filteredStocks.length && (
        <div className="text-center mt-4">
          <button
            onClick={() => setVisibleCount((v) => v + 20)}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Show More
          </button>
        </div>
      )}
    </div>
  );
}
