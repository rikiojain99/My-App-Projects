"use client";

import { useEffect, useMemo, useState } from "react";
import AnimatedNumber from "@/components/reportStock/AnimatedNumber";
import ReportsFilters from "@/components/reportStock/ReportsFilters";   
import MonthlyBarChart from "@/components/reportStock/MonthlyBarChart";
import VendorPieChart from "@/components/reportStock/VendorPieChart";

export default function ReportsPage() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [vendorFilter, setVendorFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stock")
      .then((r) => r.json())
      .then((data) => {
        setStocks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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

  const totalExpense = useMemo(() => {
    return filteredStocks.reduce(
      (sum, s) => sum + s.grandTotal,
      0
    );
  }, [filteredStocks]);

  if (loading) {
    return (
      <div className="p-6 text-center">
        Loading reports...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">

        <h1 className="text-2xl font-bold">
          Stock Reports
        </h1>

        {/* TOTAL CARD */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-gray-500 text-sm">
            Total Expense
          </div>
          <div className="text-2xl font-bold">
            <AnimatedNumber value={totalExpense} />
          </div>
        </div>

        {/* FILTERS */}
        <ReportsFilters
          vendorFilter={vendorFilter}
          setVendorFilter={setVendorFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          monthFilter={monthFilter}
          setMonthFilter={setMonthFilter}
          clearFilters={() => {
            setVendorFilter("");
            setDateFilter("");
            setMonthFilter("");
          }}
        />

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlyBarChart stocks={filteredStocks} />
          <VendorPieChart stocks={filteredStocks} />
        </div>

      </div>
    </div>
  );
}
