"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import SaveStatusPopup, {
  type SavePopupStatus,
} from "@/components/ui/SaveStatusPopup";

type StockItem = {
  _id: string;
  itemName: string;
  availableQty: number;
  rate: number;
};

export default function StockHoldings() {
  const [data, setData] = useState<StockItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(
    null
  );
  const [draft, setDraft] = useState({
    itemName: "",
    availableQty: "",
    rate: "",
  });
  const [saving, setSaving] = useState(false);
  const [totalAccessKey, setTotalAccessKey] = useState("");
  const [isTotalUnlocked, setIsTotalUnlocked] = useState(false);
  const [totalUnlockError, setTotalUnlockError] = useState("");
  const [showTotalPopup, setShowTotalPopup] = useState(false);

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

  const fetchData = async (q = "") => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `/api/stock-holdings?search=${encodeURIComponent(q)}`
      );
      if (!res.ok) {
        throw new Error("Failed to load stock holdings");
      }
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err: any) {
      setData([]);
      setMessage(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<"itemName" | "availableQty" | "rate" | "">("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sortedData = useMemo(() => {
    if (!sortBy) return [...data];

    const sorted = [...data].sort((a, b) => {
      const aVal = sortBy === "itemName" ? a.itemName.toLowerCase() : a[sortBy];
      const bVal = sortBy === "itemName" ? b.itemName.toLowerCase() : b[sortBy];

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [data, sortBy, sortDir]);

  const handleSortChange = (field: "itemName" | "availableQty" | "rate") => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  const totalStockValue = useMemo(
    () =>
      data.reduce(
        (total, item) =>
          total + Number(item.availableQty ?? 0) * Number(item.rate ?? 0),
        0
      ),
    [data]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchData(debouncedSearch);
  }, [debouncedSearch]);

  const startEdit = (item: StockItem) => {
    setEditingId(item._id);
    setDraft({
      itemName: item.itemName || "",
      availableQty: String(item.availableQty ?? 0),
      rate: String(item.rate ?? 0),
    });
    setMessage("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({ itemName: "", availableQty: "", rate: "" });
  };

  const saveEdit = async () => {
    if (!editingId || saving) return;

    const itemName = draft.itemName.trim();
    const availableQty = Number(draft.availableQty);
    const rate = Number(draft.rate);

    if (!itemName) {
      setMessage("Item name is required");
      setSavePopup({
        open: true,
        status: "error",
        title: "Save failed",
        message: "Item name is required",
      });
      return;
    }

    if (
      !Number.isFinite(availableQty) ||
      availableQty < 0 ||
      !Number.isFinite(rate) ||
      rate < 0
    ) {
      setMessage("Qty and rate must be non-negative");
      setSavePopup({
        open: true,
        status: "error",
        title: "Save failed",
        message: "Qty and rate must be non-negative",
      });
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setSavePopup({
        open: true,
        status: "saving",
        title: "Saving stock update",
        message: "Please wait while we save data.",
      });

      const res = await fetch("/api/stock-holdings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          itemName,
          availableQty,
          rate,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        const errMsg = json?.error || "Failed to update stock";
        setMessage(errMsg);
        setSavePopup({
          open: true,
          status: "error",
          title: "Save failed",
          message: errMsg,
        });
        return;
      }

      setData((prev) =>
        prev.map((row) =>
          row._id === editingId
            ? {
                ...row,
                itemName: json.itemName,
                availableQty: json.availableQty,
                rate: json.rate ?? 0,
              }
            : row
        )
      );
      setEditingId(null);
      setDraft({ itemName: "", availableQty: "", rate: "" });
      setMessage("Stock updated successfully");
      setSavePopup({
        open: true,
        status: "success",
        title: "Stock updated",
        message: "Data has been saved successfully.",
      });
    } catch {
      setMessage("Something went wrong while updating");
      setSavePopup({
        open: true,
        status: "error",
        title: "Save failed",
        message: "Something went wrong while updating",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="p-4 md:p-8 text-black bg-white min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          {/* <h1 className="text-xl font-bold text-black">Stock Holdings</h1> */}

          <div className="flex items-center gap-3">
            {isTotalUnlocked ? (
              <div className="text-xl font-semibold text-blue-700">
                Stock Holdings :- {totalStockValue.toLocaleString("en-IN")}
              </div>
            ) : (
              <button
                onClick={() => setShowTotalPopup(true)}
                className="text-xl font-bold text-black"
              >
                Stock Holdings
              </button>
            )}
          </div>
        </div>

        {/* SEARCH */}
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search item name..."
            className="w-full md:w-80 p-2 border rounded text-black focus:ring-2 focus:ring-blue-300"
          />
          <button
            onClick={() => fetchData(search.trim())}
            className="w-full md:w-32 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Refresh
          </button>
        </div>

        {showTotalPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full  max-w-sm rounded-xl bg-white p-5 shadow-lg">
              <h2 className="text-lg font-semibold mb-3">Enter key</h2>
              
              <input
                type="password"
                value={totalAccessKey}
                onChange={(e) => setTotalAccessKey(e.target.value)}
                placeholder="Access key"
                className="w-full border p-2 rounded mb-2"
              />
              {totalUnlockError && (
                <div className="mb-2 text-sm text-red-600">
                  {totalUnlockError}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowTotalPopup(false);
                    setTotalUnlockError("");
                    setTotalAccessKey("");
                  }}
                  className="px-3 py-1 rounded border"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (totalAccessKey === "1400") {
                      setIsTotalUnlocked(true);
                      setShowTotalPopup(false);
                      setTotalUnlockError("");
                    } else {
                      setTotalUnlockError(
                        "Incorrect key. Please enter 1400."
                      );
                    }
                    setTotalAccessKey("");
                  }}
                  className="px-3 py-1 rounded bg-blue-600 text-white"
                >
                  Unlock
                </button>
              </div>
            </div>
          </div>
        )}

        {message && (
          <p className="mb-3 text-sm text-gray-700">{message}</p>
        )}

        {/* SORT CONTROLS */}
        <div className="flex flex-wrap items-center gap-3 mb-2 text-sm">
          <span className="font-medium">Sort:</span>
          <button
            onClick={() => handleSortChange("itemName")}
            className={`px-2 py-1 rounded border ${
              sortBy === "itemName"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-700"
            }`}
          >
            Name {sortBy === "itemName" ? (sortDir === "asc" ? "↑" : "↓") : ""}
          </button>
          <button
            onClick={() => handleSortChange("availableQty")}
            className={`px-2 py-1 rounded border ${
              sortBy === "availableQty"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-700"
            }`}
          >
            Qty {sortBy === "availableQty" ? (sortDir === "asc" ? "↑" : "↓") : ""}
          </button>
          <button
            onClick={() => handleSortChange("rate")}
            className={`px-2 py-1 rounded border ${
              sortBy === "rate"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-700"
            }`}
          >
            Rate {sortBy === "rate" ? (sortDir === "asc" ? "↑" : "↓") : ""}
          </button>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto  border border-slate-200 shadow-sm">
          <table className="w-full min-w-\[620px\] border text-sm md:text-base">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Item Name</th>
                <th className="border p-2 text-center">Rate</th>
                <th className="border p-2 text-center">
                  Available Qty
                </th>
                <th className="border p-2 text-center">Status</th>
                <th className="border p-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="p-4 text-center">
                    Loading...
                  </td>
                </tr>
              )}

              {!loading && data.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center">
                    No stock found
                  </td>
                </tr>
              )}

              {sortedData.map((item) => (
                <tr key={item._id}>
                  <td className="border p-2">
                    {editingId === item._id ? (
                      <input
                        type="text"
                        value={draft.itemName}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            itemName: e.target.value,
                          }))
                        }
                        className="w-full border rounded px-2 py-1"
                        disabled={saving}
                      />
                    ) : (
                      item.itemName
                    )}
                  </td>
                  <td className="border p-2 text-center">
                    {editingId === item._id ? (
                      <input
                        type="number"
                        min={0}
                        value={draft.rate}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            rate: e.target.value,
                          }))
                        }
                        className="w-24 border rounded px-2 py-1 text-center"
                        disabled={saving}
                      />
                    ) : (
                      `₹ ${item.rate ?? 0}`
                    )}
                  </td>
                  <td className="border p-2 text-center">
                    {editingId === item._id ? (
                      <input
                        type="number"
                        min={0}
                        value={draft.availableQty}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            availableQty: e.target.value,
                          }))
                        }
                        className="w-24 border rounded px-2 py-1 text-center"
                        disabled={saving}
                      />
                    ) : (
                      item.availableQty
                    )}
                  </td>
                  <td className="border p-2 text-center">
                    {item.availableQty <= 5 ? (
                      <span className="text-red-600 font-semibold">
                        Low
                      </span>
                    ) : (
                      <span className="text-green-600 font-semibold">
                        OK
                      </span>
                    )}
                  </td>
                  <td className="border p-2 text-center">
                    {editingId === item._id ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={saveEdit}
                          disabled={saving}
                          className={`px-2 py-1 rounded text-white ${
                            saving
                              ? "bg-green-400"
                              : "bg-green-600"
                          }`}
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          className="px-2 py-1 rounded border"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(item)}
                        className="px-3 py-1 rounded border hover:bg-gray-50"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <SaveStatusPopup
        open={savePopup.open}
        status={savePopup.status}
        title={savePopup.title}
        message={savePopup.message}
        onClose={() =>
          setSavePopup((prev) => ({ ...prev, open: false }))
        }
      />
    </ProtectedRoute>
  );
}
