"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ExpenseRecord = {
  _id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  note?: string;
};

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);

const formatDate = (value: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN");
};

export default function ViewExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(search.trim().toLowerCase()),
      250
    );
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        if (fromDate) params.set("from", fromDate);
        if (toDate) params.set("to", toDate);

        const query = params.toString();
        const res = await fetch(
          `/api/expenses${query ? `?${query}` : ""}`
        );

        if (!res.ok) {
          setExpenses([]);
          return;
        }

        const data: ExpenseRecord[] = await res.json();
        setExpenses(Array.isArray(data) ? data : []);
      } catch {
        setExpenses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [fromDate, toDate]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((expense) => {
      const category = (expense.category || "").trim();
      if (category) set.add(category);
    });
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, "en", { sensitivity: "base" })
    );
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesCategory =
        categoryFilter === "all" ||
        expense.category === categoryFilter;

      const query = debouncedSearch;
      const haystack = [
        expense.title || "",
        expense.category || "",
        expense.note || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        query.length === 0 || haystack.includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [expenses, categoryFilter, debouncedSearch]);

  const totalAmount = useMemo(
    () =>
      filteredExpenses.reduce(
        (sum, expense) => sum + (Number(expense.amount) || 0),
        0
      ),
    [filteredExpenses]
  );

  const setPreset = (type: "today" | "week" | "month") => {
    const today = new Date();
    const from = new Date(today);

    if (type === "week") from.setDate(today.getDate() - 7);
    if (type === "month") from.setMonth(today.getMonth() - 1);

    setFromDate(from.toISOString().slice(0, 10));
    setToDate(today.toISOString().slice(0, 10));
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCategoryFilter("all");
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Previous Expenses</h1>

          <div className="flex items-center gap-2">
            <Link
              href="/expenses/add-expense"
              className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
            >
              Add Expense
            </Link>

            <button
              type="button"
              onClick={() =>
                setShowFilters((prev) => !prev)
              }
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, category, note..."
              className="w-full rounded-md border p-2.5"
            />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <select
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value)
                }
                className="rounded-md border p-2.5"
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-md border p-2.5"
              />

              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-md border p-2.5"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPreset("today")}
                className="rounded bg-blue-100 px-3 py-1 text-sm text-blue-700"
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => setPreset("week")}
                className="rounded bg-blue-100 px-3 py-1 text-sm text-blue-700"
              >
                Last 7 Days
              </button>

              <button
                type="button"
                onClick={() => setPreset("month")}
                className="rounded bg-blue-100 px-3 py-1 text-sm text-blue-700"
              >
                Last 30 Days
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">
              Filtered Entries
            </p>
            <p className="text-2xl font-semibold text-gray-900">
              {filteredExpenses.length}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">
              Filtered Amount
            </p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatINR(totalAmount)}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <p className="rounded-lg border bg-white p-4 text-center text-gray-500">
              Loading expenses...
            </p>
          ) : filteredExpenses.length === 0 ? (
            <p className="rounded-lg border bg-white p-4 text-center text-gray-500">
              No expenses found for current filters.
            </p>
          ) : (
            filteredExpenses.map((expense) => (
              <article
                key={expense._id}
                className="rounded-xl border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      {expense.title}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {expense.category}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatINR(Number(expense.amount) || 0)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(expense.date)}
                    </p>
                  </div>
                </div>

                {expense.note && (
                  <p className="mt-2 rounded-md bg-gray-50 p-2 text-sm text-gray-700">
                    {expense.note}
                  </p>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
