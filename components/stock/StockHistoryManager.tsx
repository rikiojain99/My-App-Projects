"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import SaveStatusPopup, {
  type SavePopupStatus,
} from "@/components/ui/SaveStatusPopup";

type StockItem = {
  name: string;
  qty: number;
  rate: number;
  total: number;
};

type StockEntry = {
  _id: string;
  vendorName: string;
  purchaseDate: string;
  items: StockItem[];
  grandTotal: number;
  extraExpense?: number;
  createdAt?: string;
  updatedAt?: string;
};

type EditDraft = {
  vendorName: string;
  purchaseDate: string;
  extraExpense: string;
  items: EditItemDraft[];
};

type EditItemDraft = {
  name: string;
  qty: string;
  rate: string;
};

const emptyDraft: EditDraft = {
  vendorName: "",
  purchaseDate: "",
  extraExpense: "0",
  items: [],
};

const formatCurrency = (value: number) =>
  `Rs. ${Number(value || 0).toFixed(2)}`;

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const formatDateInput = (value: string) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

const createEmptyItemDraft = (): EditItemDraft => ({
  name: "",
  qty: "",
  rate: "",
});

const toItemDrafts = (items: StockItem[]): EditItemDraft[] =>
  items.length > 0
    ? items.map((item) => ({
        name: item.name || "",
        qty: String(item.qty ?? ""),
        rate: String(item.rate ?? ""),
      }))
    : [createEmptyItemDraft()];

export default function StockHistoryManager() {
  const [stocks, setStocks] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft>(emptyDraft);
  const [message, setMessage] = useState("");
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

  const fetchStocks = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/stock");
      const json = await res.json();
      setStocks(Array.isArray(json) ? json : []);
    } catch {
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const vendors = useMemo(() => {
    const map = new Map<string, string>();

    stocks.forEach((stock) => {
      const vendorName = String(stock.vendorName || "").trim();
      const key = vendorName.toLowerCase();

      if (vendorName && !map.has(key)) {
        map.set(key, vendorName);
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [stocks]);

  const filteredStocks = useMemo(() => {
    const searchLower = search.trim().toLowerCase();

    return stocks.filter((stock) => {
      const vendorName = String(stock.vendorName || "");
      const purchaseDate = formatDateInput(stock.purchaseDate);

      const searchMatch = searchLower
        ? vendorName.toLowerCase().includes(searchLower) ||
          stock.items.some((item) =>
            String(item.name || "")
              .toLowerCase()
              .includes(searchLower)
          )
        : true;

      const vendorMatch = vendorFilter
        ? vendorName.toLowerCase() ===
          vendorFilter.toLowerCase()
        : true;

      const dateMatch = dateFilter
        ? purchaseDate === dateFilter
        : true;

      const monthMatch = monthFilter
        ? purchaseDate.slice(0, 7) === monthFilter
        : true;

      return searchMatch && vendorMatch && dateMatch && monthMatch;
    });
  }, [stocks, search, vendorFilter, dateFilter, monthFilter]);

  const totalValue = useMemo(
    () =>
      filteredStocks.reduce(
        (sum, stock) => sum + Number(stock.grandTotal || 0),
        0
      ),
    [filteredStocks]
  );

  const totalQty = useMemo(
    () =>
      filteredStocks.reduce(
        (sum, stock) =>
          sum +
          stock.items.reduce(
            (itemSum, item) => itemSum + Number(item.qty || 0),
            0
          ),
        0
      ),
    [filteredStocks]
  );

  const startEdit = (stock: StockEntry) => {
    setEditingId(stock._id);
    setExpandedId(stock._id);
    setDraft({
      vendorName: stock.vendorName || "",
      purchaseDate: formatDateInput(stock.purchaseDate),
      extraExpense: String(stock.extraExpense ?? 0),
      items: toItemDrafts(stock.items),
    });
    setMessage("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(emptyDraft);
  };

  const updateDraftItem = (
    index: number,
    field: keyof EditItemDraft,
    value: string
  ) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
    }));
  };

  const addDraftItem = () => {
    setDraft((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyItemDraft()],
    }));
  };

  const removeDraftItem = (index: number) => {
    setDraft((prev) => {
      const nextItems = prev.items.filter(
        (_, itemIndex) => itemIndex !== index
      );

      return {
        ...prev,
        items:
          nextItems.length > 0
            ? nextItems
            : [createEmptyItemDraft()],
      };
    });
  };

  const editPreviewTotal = useMemo(() => {
    return draft.items.reduce((sum, item) => {
      const qty = Number(item.qty || 0);
      const rate = Number(item.rate || 0);

      if (!Number.isFinite(qty) || !Number.isFinite(rate)) {
        return sum;
      }

      return sum + roundMoney(qty * rate);
    }, 0);
  }, [draft.items]);

  const saveEdit = async () => {
    if (!editingId) return;

    const vendorName = draft.vendorName.trim();
    const purchaseDate = draft.purchaseDate;
    const extraExpense = Number(draft.extraExpense || 0);
    const normalizedItems = draft.items.map((item) => {
      const name = String(item.name || "").trim();
      const qty = Number(item.qty || 0);
      const rate = Number(item.rate || 0);

      return {
        name,
        qty,
        rate,
        total: roundMoney(qty * rate),
      };
    });

    const validItems = normalizedItems.filter(
      (item) =>
        item.name.length > 0 &&
        Number.isFinite(item.qty) &&
        item.qty > 0 &&
        Number.isFinite(item.rate) &&
        item.rate >= 0
    );

    const hasInvalidRows = normalizedItems.some((item) => {
      const hasAnyInput =
        item.name.length > 0 || item.qty > 0 || item.rate > 0;

      if (!hasAnyInput) return false;

      return (
        item.name.length === 0 ||
        !Number.isFinite(item.qty) ||
        item.qty <= 0 ||
        !Number.isFinite(item.rate) ||
        item.rate < 0
      );
    });

    if (!vendorName) {
      setMessage("Vendor name is required");
      setSavePopup({
        open: true,
        status: "error",
        title: "Save failed",
        message: "Vendor name is required",
      });
      return;
    }

    if (!purchaseDate) {
      setMessage("Purchase date is required");
      setSavePopup({
        open: true,
        status: "error",
        title: "Save failed",
        message: "Purchase date is required",
      });
      return;
    }

    if (validItems.length === 0) {
      setMessage("Add at least one valid item");
      setSavePopup({
        open: true,
        status: "error",
        title: "Save failed",
        message: "Add at least one valid item",
      });
      return;
    }

    if (hasInvalidRows) {
      setMessage("Fix invalid item rows before saving");
      setSavePopup({
        open: true,
        status: "error",
        title: "Save failed",
        message: "Fix invalid item rows before saving",
      });
      return;
    }

    if (!Number.isFinite(extraExpense) || extraExpense < 0) {
      setMessage("Extra expense must be non-negative");
      setSavePopup({
        open: true,
        status: "error",
        title: "Save failed",
        message: "Extra expense must be non-negative",
      });
      return;
    }

    try {
      setSavePopup({
        open: true,
        status: "saving",
        title: "Updating stock entry",
        message: "Please wait while we save changes.",
      });

      const res = await fetch("/api/stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          vendorName,
          purchaseDate,
          extraExpense,
          items: validItems,
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

      setStocks((prev) =>
        prev.map((stock) =>
          stock._id === editingId ? json : stock
        )
      );
      setEditingId(null);
      setDraft(emptyDraft);
      setMessage("Stock entry updated successfully");
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
    }
  };

  const clearFilters = () => {
    setSearch("");
    setVendorFilter("");
    setDateFilter("");
    setMonthFilter("");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-3 gap-1 lg:flex-row lg:items-end lg:justify-between">
              <div className="col-span-2  w-full">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                  Inventory
                </p>
                {/* <h1 className="text-3xl font-bold tracking-tight">
                  Stock History Manager
                </h1> */}
                {/* <p className="max-w-2xl text-sm text-slate-600">
                  See vendor name, purchase date, item details, and
                  update the stock entry information from one place.
                </p> */}
              </div>
              <div className="col-span-1 grid w-full">

              <button
                type="button"
                onClick={fetchStocks}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
              >
                Refresh
              </button>
</div>
            </div>
          </section>

         

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Search
                </h2>
                
                {/* <p className="text-sm text-slate-500">
                  Search by vendor or item and filter by vendor or
                  purchase date.
                </p> */}
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium hover:bg-slate-200"
              >
                Clear filters
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vendor or item"
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />

              {/* <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                <option value="">All vendors</option>
                {vendors.map((vendor) => (
                  <option key={vendor} value={vendor}>
                    {vendor}
                  </option>
                ))}
              </select> */}

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />

              <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </div>
          </section>

          {message && (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              {message}
            </div>
          )}

          <section className="space-y-4">
            {loading && (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                Loading stock history...
              </div>
            )}

            {!loading && filteredStocks.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
                <h3 className="text-lg font-semibold">
                  No stock entries found
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Try a different search or filter.
                </p>
              </div>
            )}

            {!loading &&
              filteredStocks.map((stock) => {
                const isExpanded = expandedId === stock._id;
                const isEditing = editingId === stock._id;
                const lineQty = stock.items.reduce(
                  (sum, item) => sum + Number(item.qty || 0),
                  0
                );

                return (
                  <article
                    key={stock._id}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="grid gap-4 p-5 lg:grid-cols-[2fr_1fr_auto] lg:items-center">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                            {stock.vendorName}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            {formatDateInput(stock.purchaseDate)}
                          </span>
                        </div>

                        <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-3">
                          <div>
                            <span className="font-medium text-slate-900">
                              Qty:
                            </span>{" "}
                            {lineQty}
                          </div>
                          <div>
                            <span className="font-medium text-slate-900">
                              Lines:
                            </span>{" "}
                            {stock.items.length}
                          </div>
                          <div>
                            <span className="font-medium text-slate-900">
                              Extra:
                            </span>{" "}
                            {formatCurrency(stock.extraExpense ?? 0)}
                          </div>
                        </div>
                      </div>

                      <div className="text-left lg:text-right">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Grand Total
                        </div>
                        <div className="text-2xl font-bold">
                          {formatCurrency(stock.grandTotal)}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId((prev) =>
                              prev === stock._id ? null : stock._id
                            )
                          }
                          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
                        >
                          {isExpanded ? "Hide details" : "View details"}
                        </button>

                        <button
                          type="button"
                          onClick={() => startEdit(stock)}
                          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                        >
                          Edit entry
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-200 bg-slate-50/70 p-5 space-y-5">
                        {isEditing && (
                          <div className="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
                            <h3 className="font-semibold">
                              Update stock entry
                            </h3>
                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                              <input
                                type="text"
                                value={draft.vendorName}
                                onChange={(e) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    vendorName: e.target.value,
                                  }))
                                }
                                placeholder="Vendor name"
                                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                              />

                              <input
                                type="date"
                                value={draft.purchaseDate}
                                onChange={(e) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    purchaseDate: e.target.value,
                                  }))
                                }
                                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                              />

                              <input
                                type="number"
                                min={0}
                                value={draft.extraExpense}
                                onChange={(e) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    extraExpense: e.target.value,
                                  }))
                                }
                                placeholder="Extra expense"
                                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                              />
                            </div>

                            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
                              <table className="min-w-full text-sm">
                                <thead className="bg-slate-100 text-slate-600">
                                  <tr>
                                    <th className="px-4 py-3 text-left">
                                      Item
                                    </th>
                                    <th className="px-4 py-3 text-center">
                                      Qty
                                    </th>
                                    <th className="px-4 py-3 text-center">
                                      Rate
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                      Total
                                    </th>
                                    <th className="px-4 py-3 text-center">
                                      Action
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {draft.items.map((item, index) => {
                                    const itemQty = Number(item.qty || 0);
                                    const itemRate = Number(item.rate || 0);
                                    const itemTotal =
                                      Number.isFinite(itemQty) &&
                                      Number.isFinite(itemRate)
                                        ? roundMoney(
                                            itemQty * itemRate
                                          )
                                        : 0;

                                    return (
                                      <tr
                                        key={`edit-item-${index}`}
                                        className="border-t border-slate-100"
                                      >
                                        <td className="px-4 py-3">
                                          <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) =>
                                              updateDraftItem(
                                                index,
                                                "name",
                                                e.target.value
                                              )
                                            }
                                            placeholder="Item name"
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                          />
                                        </td>
                                        <td className="px-4 py-3">
                                          <input
                                            type="number"
                                            min={0}
                                            value={item.qty}
                                            onChange={(e) =>
                                              updateDraftItem(
                                                index,
                                                "qty",
                                                e.target.value
                                              )
                                            }
                                            placeholder="0"
                                            className="w-24 rounded-xl border border-slate-300 px-3 py-2 text-center outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                          />
                                        </td>
                                        <td className="px-4 py-3">
                                          <input
                                            type="number"
                                            min={0}
                                            value={item.rate}
                                            onChange={(e) =>
                                              updateDraftItem(
                                                index,
                                                "rate",
                                                e.target.value
                                              )
                                            }
                                            placeholder="0"
                                            className="w-24 rounded-xl border border-slate-300 px-3 py-2 text-center outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                          />
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold">
                                          {formatCurrency(itemTotal)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              removeDraftItem(index)
                                            }
                                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                                          >
                                            Remove
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                              <button
                                type="button"
                                onClick={addDraftItem}
                                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
                              >
                                Add item row
                              </button>

                              <div className="text-sm font-semibold text-slate-700">
                                Entry total preview:{" "}
                                {formatCurrency(editPreviewTotal)}
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={saveEdit}
                                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                              >
                                Save changes
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                          <table className="min-w-full text-sm">
                            <thead className="bg-slate-100 text-slate-600">
                              <tr>
                                <th className="px-4 py-3 text-left">
                                  Item
                                </th>
                                <th className="px-4 py-3 text-center">
                                  Qty
                                </th>
                                <th className="px-4 py-3 text-center">
                                  Rate
                                </th>
                                <th className="px-4 py-3 text-right">
                                  Total
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {stock.items.map((item, index) => (
                                <tr
                                  key={`${stock._id}-${index}`}
                                  className="border-t border-slate-100"
                                >
                                  <td className="px-4 py-3 font-medium">
                                    {item.name}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {item.qty}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {formatCurrency(item.rate)}
                                  </td>
                                  <td className="px-4 py-3 text-right font-semibold">
                                    {formatCurrency(item.total)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
{/* 
                        <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                            <span className="font-medium text-slate-900">
                              Created:
                            </span>{" "}
                            {stock.createdAt
                              ? new Date(
                                  stock.createdAt
                                ).toLocaleString()
                              : "-"}
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                            <span className="font-medium text-slate-900">
                              Updated:
                            </span>{" "}
                            {stock.updatedAt
                              ? new Date(
                                  stock.updatedAt
                                ).toLocaleString()
                              : "-"}
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                            <span className="font-medium text-slate-900">
                              Entry ID:
                            </span>{" "}
                            {stock._id}
                          </div>
                        </div> */}
                      </div>
                    )}
                  </article>
                );
              })}
          </section>
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

function MetricCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-2xl border grid grid-cols-3 gap-1 border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="text-lg col-span-2 w-full font-medium text-slate-900">
        {label}
      </div>
      <div className="text-lg font-bold col-span-1 w-full text-slate-900">
        {value}
      </div>
      {/*<div className="mt-1 text-xs text-slate-400">{caption}</div> */}
    </div>
  );
}
