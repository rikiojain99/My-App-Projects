"use client";

import { useEffect, useState } from "react";
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
    const res = await fetch(
      `/api/stock-holdings?search=${encodeURIComponent(q)}`
    );
    const json = await res.json();
    setData(Array.isArray(json) ? json : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        <h1 className="text-xl font-bold mb-4 text-black">
          Stock Holdings
        </h1>

        {/* SEARCH */}
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            fetchData(e.target.value);
          }}
          placeholder="Search item name..."
          className="w-full max-w-md p-2 mb-4 border rounded text-black"
        />

        {message && (
          <p className="mb-3 text-sm text-gray-700">{message}</p>
        )}

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full border">
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

              {data.map((item) => (
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
