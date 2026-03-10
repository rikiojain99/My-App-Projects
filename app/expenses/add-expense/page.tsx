"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import SaveStatusPopup, {
  type SavePopupStatus,
} from "@/components/ui/SaveStatusPopup";

type ExpenseTemplate = {
  _id: string;
  title: string;
  category: string;
  amount: number;
  note?: string;
};

export default function AddExpense() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [historyByTitle, setHistoryByTitle] = useState<
    ExpenseTemplate[]
  >([]);
  const [isHistoryLoading, setIsHistoryLoading] =
    useState(true);
  const [showTitleSuggestions, setShowTitleSuggestions] =
    useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] =
    useState(-1);
  const blurTimer = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [savePopup, setSavePopup] = useState<{
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

  useEffect(() => {
    const loadExpenseHistory = async () => {
      try {
        const res = await fetch("/api/expenses?limit=500");
        if (!res.ok) return;

        const data: ExpenseTemplate[] = await res.json();
        const uniqueByTitle = new Map<
          string,
          ExpenseTemplate
        >();

        for (const expense of Array.isArray(data) ? data : []) {
          const normalizedTitle =
            expense.title?.trim().toLowerCase() || "";

          // Keep only latest record per title for fast autofill.
          if (!normalizedTitle || uniqueByTitle.has(normalizedTitle)) {
            continue;
          }

          uniqueByTitle.set(normalizedTitle, expense);
        }

        setHistoryByTitle(Array.from(uniqueByTitle.values()));
      } finally {
        setIsHistoryLoading(false);
      }
    };

    loadExpenseHistory();

    return () => {
      if (blurTimer.current) clearTimeout(blurTimer.current);
    };
  }, []);

  const normalizedTitle = title.trim().toLowerCase();

  const titleSuggestions = useMemo(() => {
    if (normalizedTitle.length < 2) return [];

    return historyByTitle
      .filter((expense) =>
        expense.title
          .trim()
          .toLowerCase()
          .includes(normalizedTitle)
      )
      .slice(0, 8);
  }, [historyByTitle, normalizedTitle]);

  const exactTitleMatch = useMemo(() => {
    if (!normalizedTitle) return null;

    return (
      historyByTitle.find(
        (expense) =>
          expense.title.trim().toLowerCase() ===
          normalizedTitle
      ) || null
    );
  }, [historyByTitle, normalizedTitle]);

  const applyPreviousExpense = (
    expense: ExpenseTemplate
  ) => {
    setTitle(expense.title || "");
    setCategory(expense.category || "");
    setAmount(Number(expense.amount) || 0);
    setNote(expense.note || "");
    setShowTitleSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavePopup({
      open: true,
      status: "saving",
      title: "Saving expense",
      message: "Please wait while we save data.",
    });

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          amount,
          date,
          note,
        }),
      });

      if (!res.ok) {
        setMessage("Failed to save expense");
        setSavePopup({
          open: true,
          status: "error",
          title: "Save failed",
          message: "Failed to save expense",
        });
        return;
      }

      setMessage("Expense added");
      setSavePopup({
        open: true,
        status: "success",
        title: "Expense saved",
        message: "Data has been saved successfully.",
      });
      setTitle("");
      setCategory("");
      setAmount(0);
      setNote("");
    } catch {
      setMessage("Failed to save expense");
      setSavePopup({
        open: true,
        status: "error",
        title: "Save failed",
        message: "Network error while saving expense",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white border rounded-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Add Expense</h1>
        <Link
          href="/expenses/view-expenses"
          className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Previous Expenses
        </Link>
      </div>

      {message && <p className="mb-2 text-sm">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setShowTitleSuggestions(true);
              setActiveSuggestionIndex(-1);
            }}
            onFocus={() => {
              if (blurTimer.current) {
                clearTimeout(blurTimer.current);
              }
              setShowTitleSuggestions(true);
            }}
            onBlur={() => {
              blurTimer.current = setTimeout(() => {
                setShowTitleSuggestions(false);
                setActiveSuggestionIndex(-1);
              }, 120);
            }}
            onKeyDown={(e) => {
              if (!titleSuggestions.length) return;

              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveSuggestionIndex((prev) =>
                  prev < titleSuggestions.length - 1 ? prev + 1 : 0
                );
                return;
              }

              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveSuggestionIndex((prev) =>
                  prev > 0 ? prev - 1 : titleSuggestions.length - 1
                );
                return;
              }

              if (
                e.key === "Enter" &&
                activeSuggestionIndex >= 0 &&
                activeSuggestionIndex < titleSuggestions.length
              ) {
                e.preventDefault();
                applyPreviousExpense(
                  titleSuggestions[activeSuggestionIndex]
                );
                return;
              }

              if (e.key === "Escape") {
                setShowTitleSuggestions(false);
                setActiveSuggestionIndex(-1);
              }
            }}
            placeholder="Expense title"
            className="w-full border p-2 rounded"
            required
          />

          {showTitleSuggestions &&
            titleSuggestions.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
                {titleSuggestions.map((expense, index) => (
                  <li
                    key={expense._id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyPreviousExpense(expense);
                    }}
                    className={`cursor-pointer px-3 py-2 ${
                      index === activeSuggestionIndex
                        ? "bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {expense.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {expense.category} | INR {expense.amount}
                    </p>
                  </li>
                ))}
              </ul>
            )}
        </div>

        {!isHistoryLoading && exactTitleMatch && (
          <button
            type="button"
            onClick={() => applyPreviousExpense(exactTitleMatch)}
            className="w-full rounded border border-blue-200 bg-blue-50 px-2 py-1.5 text-sm text-blue-700 hover:bg-blue-100"
          >
            Use previous details for this title
          </button>
        )}

        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category (Rent, Electricity...)"
          className="w-full border p-2 rounded"
          required
        />

        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={amount === 0 ? "" : String(amount)}
          onChange={(e) =>
            setAmount(Number(e.target.value.replace(/\D/g, "")) || 0)
          }
          onKeyDown={(e) => {
            if (e.ctrlKey || e.metaKey) return;
            if (
              !/^\d$/.test(e.key) &&
              ![
                "Backspace",
                "Delete",
                "ArrowLeft",
                "ArrowRight",
                "Tab",
                "Home",
                "End",
              ].includes(e.key)
            ) {
              e.preventDefault();
            }
          }}
          placeholder="Amount"
          className="w-full border p-2 rounded"
          required
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          className="w-full border p-2 rounded"
        />

        <button
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Expense"}
        </button>
      </form>

      <SaveStatusPopup
        open={savePopup.open}
        status={savePopup.status}
        title={savePopup.title}
        message={savePopup.message}
        onClose={() =>
          setSavePopup((prev) => ({ ...prev, open: false }))
        }
      />
    </div>
  );
}
