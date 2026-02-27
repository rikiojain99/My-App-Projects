"use client";

import { useState } from "react";
import SaveStatusPopup, {
  type SavePopupStatus,
} from "@/components/ui/SaveStatusPopup";

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
      <h1 className="text-xl font-bold mb-4">Add Expense</h1>

      {message && <p className="mb-2 text-sm">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Expense title"
          className="w-full border p-2 rounded"
          required
        />

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
