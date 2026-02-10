"use client";

import { startOfWeek, endOfWeek } from "date-fns";

export default function BillFilters({
  filters,
  setFilters,
}: any) {
  const today = new Date();

  const setToday = () => {
    const d = today.toISOString().split("T")[0];
    setFilters({ ...filters, fromDate: d, toDate: d });
  };

  const setThisWeek = () => {
    const start = startOfWeek(today, { weekStartsOn: 1 })
      .toISOString()
      .split("T")[0];

    const end = endOfWeek(today, { weekStartsOn: 1 })
      .toISOString()
      .split("T")[0];

    setFilters({ ...filters, fromDate: start, toDate: end });
  };

  const setThisMonth = () => {
    const start = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    )
      .toISOString()
      .split("T")[0];

    const end = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    )
      .toISOString()
      .split("T")[0];

    setFilters({ ...filters, fromDate: start, toDate: end });
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">

      {/* SEARCH FIELDS */}
      <input
        placeholder="Customer Name"
        value={filters.name}
        onChange={(e) =>
          setFilters({ ...filters, name: e.target.value })
        }
        className="w-full border p-2 rounded"
      />

      <input
        placeholder="Mobile"
        value={filters.mobile}
        onChange={(e) =>
          setFilters({ ...filters, mobile: e.target.value })
        }
        className="w-full border p-2 rounded"
      />

      <input
        placeholder="City"
        value={filters.city}
        onChange={(e) =>
          setFilters({ ...filters, city: e.target.value })
        }
        className="w-full border p-2 rounded"
      />

      {/* DATE RANGE */}
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={filters.fromDate}
          onChange={(e) =>
            setFilters({
              ...filters,
              fromDate: e.target.value,
            })
          }
          className="border p-2 rounded"
        />

        <input
          type="date"
          value={filters.toDate}
          onChange={(e) =>
            setFilters({
              ...filters,
              toDate: e.target.value,
            })
          }
          className="border p-2 rounded"
        />
      </div>

      {/* PRESETS */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={setToday}
          className="px-3 py-1 text-xs bg-blue-100 rounded"
        >
          Today
        </button>

        <button
          onClick={setThisWeek}
          className="px-3 py-1 text-xs bg-blue-100 rounded"
        >
          This Week
        </button>

        <button
          onClick={setThisMonth}
          className="px-3 py-1 text-xs bg-blue-100 rounded"
        >
          This Month
        </button>
      </div>
    </div>
  );
}
