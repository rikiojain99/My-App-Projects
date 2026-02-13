"use client";
import { useState } from "react";

export default function ReportsFilters({
  vendorFilter,
  setVendorFilter,
  dateFilter,
  setDateFilter,
  monthFilter,
  setMonthFilter,
  clearFilters,
}: any) {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex justify-between items-center font-semibold"
      >
        Filters
        <span
          className={`transition ${
            open ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      <div
        className={`transition-all duration-300 overflow-hidden ${
          open ? "max-h-96 p-4" : "max-h-0"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            placeholder="Vendor"
            value={vendorFilter}
            onChange={(e) =>
              setVendorFilter(e.target.value)
            }
            className="border p-2 rounded"
          />

          <input
            type="date"
            value={dateFilter}
            onChange={(e) =>
              setDateFilter(e.target.value)
            }
            className="border p-2 rounded"
          />

          <input
            type="month"
            value={monthFilter}
            onChange={(e) =>
              setMonthFilter(e.target.value)
            }
            className="border p-2 rounded"
          />

          <button
            onClick={clearFilters}
            className="bg-gray-200 rounded p-2"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
