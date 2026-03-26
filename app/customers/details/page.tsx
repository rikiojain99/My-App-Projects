"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import SaveStatusPopup, {
  type SavePopupStatus,
} from "@/components/ui/SaveStatusPopup";

type CustomerRow = {
  _id: string;
  name: string;
  type: string;
  city: string;
  mobile: string;
  isDisabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
  billCount?: number;
  totalSpent?: number;
  lastBillDate?: string | null;
};

type CustomerDraft = {
  name: string;
  type: string;
  city: string;
  mobile: string;
};

type BillRow = {
  _id: string;
  billNo: string;
  finalTotal: number;
  createdAt?: string;
};

const emptyDraft: CustomerDraft = {
  name: "",
  type: "",
  city: "",
  mobile: "",
};

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export default function CustomerDetailsPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CustomerDraft>(emptyDraft);
  const [recentBills, setRecentBills] = useState<Record<string, BillRow[]>>(
    {}
  );
  const [allBillsLoaded, setAllBillsLoaded] = useState<
    Record<string, boolean>
  >({});
  const [loadingBillsFor, setLoadingBillsFor] = useState<string | null>(
    null
  );
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

  const fetchCustomers = async (query = search) => {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("search", query.trim());

      const res = await fetch(`/api/customers?${params.toString()}`);
      const json = await res.json();
      setCustomers(Array.isArray(json) ? json : []);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers("");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const totals = useMemo(() => {
    return customers.reduce(
      (acc, customer) => {
        acc.customerCount += 1;
        acc.billCount += Number(customer.billCount || 0);
        acc.totalSpent += Number(customer.totalSpent || 0);
        return acc;
      },
      { customerCount: 0, billCount: 0, totalSpent: 0 }
    );
  }, [customers]);

  const loadCustomerBills = async (
    customer: CustomerRow,
    fetchAll = false
  ) => {
    const key = customer._id;
    if (!fetchAll && recentBills[key]) return;
    if (fetchAll && allBillsLoaded[key]) return;

    setLoadingBillsFor(key);
    try {
      const params = new URLSearchParams({
        mobile: customer.mobile,
      });
      if (fetchAll) {
        params.set("limit", "all");
      }

      const res = await fetch(
        `/api/bills/by-customer?${params.toString()}`
      );
      const json = await res.json();
      const rows = Array.isArray(json) ? json : [];

      setRecentBills((prev) => ({
        ...prev,
        [key]: rows,
      }));
      if (fetchAll) {
        setAllBillsLoaded((prev) => ({ ...prev, [key]: true }));
      }
    } catch {
      setRecentBills((prev) => ({ ...prev, [key]: [] }));
    } finally {
      setLoadingBillsFor(null);
    }
  };

  const toggleExpand = async (customer: CustomerRow) => {
    const nextId = expandedId === customer._id ? null : customer._id;
    setExpandedId(nextId);
    if (nextId) {
      await loadCustomerBills(customer);
    }
  };

  const startEdit = (customer: CustomerRow) => {
    setEditingId(customer._id);
    setExpandedId(customer._id);
    setDraft({
      name: customer.name || "",
      type: customer.type || "",
      city: customer.city || "",
      mobile: customer.mobile || "",
    });
    setMessage("");
    void loadCustomerBills(customer);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(emptyDraft);
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const payload = {
      id: editingId,
      name: draft.name.trim(),
      type: draft.type.trim(),
      city: draft.city.trim(),
      mobile: draft.mobile.trim(),
    };

    if (!payload.name || !payload.type) {
      setMessage("Customer name and type are required");
      setSavePopup({
        open: true,
        status: "error",
        title: "Save failed",
        message: "Customer name and type are required",
      });
      return;
    }

    if (
      !payload.mobile ||
      (payload.mobile !== "FAST-SALE" &&
        !/^\d{10}$/.test(payload.mobile))
    ) {
      setMessage("Mobile must be 10 digits or FAST-SALE");
      setSavePopup({
        open: true,
        status: "error",
        title: "Save failed",
        message: "Mobile must be 10 digits or FAST-SALE",
      });
      return;
    }

    try {
      setSavePopup({
        open: true,
        status: "saving",
        title: "Updating customer",
        message: "Please wait while we save changes.",
      });

      const res = await fetch("/api/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        const errMsg = json?.error || "Failed to update customer";
        setMessage(errMsg);
        setSavePopup({
          open: true,
          status: "error",
          title: "Save failed",
          message: errMsg,
        });
        return;
      }

      setCustomers((prev) =>
        prev.map((customer) =>
          customer._id === editingId
            ? {
                ...customer,
                ...json,
              }
            : customer
        )
      );

      setRecentBills((prev) => {
        const next = { ...prev };
        delete next[editingId];
        return next;
      });
      setAllBillsLoaded((prev) => {
        const next = { ...prev };
        delete next[editingId];
        return next;
      });

      setEditingId(null);
      setDraft(emptyDraft);
      setMessage("Customer updated successfully");
      setSavePopup({
        open: true,
        status: "success",
        title: "Customer updated",
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

  const toggleDisabled = async (customer: CustomerRow) => {
    try {
      setSavePopup({
        open: true,
        status: "saving",
        title: customer.isDisabled
          ? "Enabling customer"
          : "Disabling customer",
        message: "Please wait while we update customer status.",
      });

      const res = await fetch("/api/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: customer._id,
          name: customer.name,
          type: customer.type,
          city: customer.city,
          mobile: customer.mobile,
          isDisabled: !customer.isDisabled,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        const errMsg =
          json?.error || "Failed to update customer status";
        setMessage(errMsg);
        setSavePopup({
          open: true,
          status: "error",
          title: "Update failed",
          message: errMsg,
        });
        return;
      }

      setCustomers((prev) =>
        prev.map((row) =>
          row._id === customer._id ? { ...row, ...json } : row
        )
      );
      setMessage(
        customer.isDisabled
          ? "Customer enabled successfully"
          : "Customer disabled successfully"
      );
      setSavePopup({
        open: true,
        status: "success",
        title: customer.isDisabled
          ? "Customer enabled"
          : "Customer disabled",
        message: "Data has been saved successfully.",
      });
    } catch {
      setMessage("Something went wrong while updating status");
      setSavePopup({
        open: true,
        status: "error",
        title: "Update failed",
        message: "Something went wrong while updating status",
      });
    }
  };

  const deleteCustomer = async (customer: CustomerRow) => {
    const confirmed = confirm(
      `Delete customer "${customer.name}"? This only works when no bills are linked.`
    );

    if (!confirmed) return;

    try {
      setSavePopup({
        open: true,
        status: "saving",
        title: "Deleting customer",
        message: "Please wait while we delete this customer.",
      });

      const res = await fetch("/api/customers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: customer._id }),
      });

      const json = await res.json();

      if (!res.ok) {
        const errMsg = json?.error || "Failed to delete customer";
        setMessage(errMsg);
        setSavePopup({
          open: true,
          status: "error",
          title: "Delete failed",
          message: errMsg,
        });
        return;
      }

      setCustomers((prev) =>
        prev.filter((row) => row._id !== customer._id)
      );
      setRecentBills((prev) => {
        const next = { ...prev };
        delete next[customer._id];
        return next;
      });
      setAllBillsLoaded((prev) => {
        const next = { ...prev };
        delete next[customer._id];
        return next;
      });
      if (expandedId === customer._id) {
        setExpandedId(null);
      }
      if (editingId === customer._id) {
        setEditingId(null);
        setDraft(emptyDraft);
      }

      setMessage("Customer deleted successfully");
      setSavePopup({
        open: true,
        status: "success",
        title: "Customer deleted",
        message: "Customer removed successfully.",
      });
    } catch {
      setMessage("Something went wrong while deleting customer");
      setSavePopup({
        open: true,
        status: "error",
        title: "Delete failed",
        message: "Something went wrong while deleting customer",
      });
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                
                <h1 className="text-xl font-bold tracking-tight">
                  Customer Details Manager
                </h1>
                
              </div>

              <button
                type="button"
                onClick={() => fetchCustomers(search)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
              >
                Refresh
              </button>
            </div>
          </section>

          <section className="grid gap-4 grid-cols-3">
            <MetricCard
              label="Customers"
              value={String(totals.customerCount)}
              // caption=""
            />
            <MetricCard
              label="Bills"
              value={String(totals.billCount)}
              // caption=""
            />
            <MetricCard
              label="Total Spent"
              value={formatINR(totals.totalSpent)}
              // caption=""
            />
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Search customers</h2>
              {/* <p className="text-sm text-slate-500">
                Search by name, mobile, city, or type.
              </p> */}
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer name / mobile / city / type"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </section>

          {message && (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              {message}
            </div>
          )}

          <section className="space-y-4">
            {loading && (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                Loading customers...
              </div>
            )}

            {!loading && customers.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
                <h3 className="text-lg font-semibold">No customers found</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Try a different search term.
                </p>
              </div>
            )}

            {!loading &&
              customers.map((customer) => {
                const isExpanded = expandedId === customer._id;
                const isEditing = editingId === customer._id;
                const customerBills = recentBills[customer._id] || [];
                const showingAllBills = Boolean(
                  allBillsLoaded[customer._id]
                );

                return (
                  <article
                    key={customer._id}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="grid gap-4 p-5 lg:grid-cols-[2fr_1fr_auto] lg:items-center">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                           <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                            {customer.billCount || "NO bills"}
                            </span>
                          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                            {customer.name || "No name"}
                          </span>
                          
                            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                            {customer.city || "No city"}

                            </span>
                          
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            {customer.mobile || "No mobile"}
                          </span>
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                            {customer.type || "No type"}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              customer.isDisabled
                                ? "bg-red-50 text-red-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {customer.isDisabled ? "Disabled" : "Active"}
                          </span>
                        </div>

                        <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-3">
                          
                          <div>
                          
                          </div>
                          <div>
                            <span className="font-medium text-slate-900">
                              Last bill:
                            </span>{" "}
                            {customer.lastBillDate
                              ? new Date(
                                  customer.lastBillDate
                                ).toLocaleDateString()
                              : "-"}
                          </div>
                        </div>
                      </div>

                      <div className="text-left lg:text-right">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Total Spent
                        </div>
                        <div className="text-xl font-bold">
                          {formatINR(customer.totalSpent || 0)}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <button
                          type="button"
                          onClick={() => void toggleExpand(customer)}
                          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
                        >
                          {isExpanded ? "Hide details" : "View details"}
                        </button>

                        <button
                          type="button"
                          onClick={() => startEdit(customer)}
                          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                        >
                          Edit customer
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggleDisabled(customer)}
                          className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
                            customer.isDisabled
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : "bg-amber-600 hover:bg-amber-700"
                          }`}
                        >
                          {customer.isDisabled ? "Enable" : "Disable"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteCustomer(customer)}
                          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-200 bg-slate-50/70 p-5 space-y-5">
                        {isEditing && (
                          <div className="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
                            <h3 className="font-semibold">Update customer</h3>
                            <p className="mt-1 text-sm text-slate-500">
                              Edit name, type, city, and mobile here.
                            </p>

                            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                              <input
                                type="text"
                                value={draft.name}
                                onChange={(e) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                  }))
                                }
                                placeholder="Customer name"
                                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                              />
                              <input
                                type="text"
                                value={draft.type}
                                onChange={(e) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    type: e.target.value,
                                  }))
                                }
                                placeholder="Customer type"
                                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                              />
                              <input
                                type="text"
                                value={draft.city}
                                onChange={(e) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    city: e.target.value,
                                  }))
                                }
                                placeholder="City"
                                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                              />
                              <input
                                type="text"
                                value={draft.mobile}
                                onChange={(e) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    mobile: e.target.value,
                                  }))
                                }
                                placeholder="Mobile"
                                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                              />
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

                        <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                            <span className="font-medium text-slate-900">
                              Created:
                            </span>{" "}
                            {customer.createdAt
                              ? new Date(
                                  customer.createdAt
                                ).toLocaleString()
                              : "-"}
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                            <span className="font-medium text-slate-900">
                              Updated:
                            </span>{" "}
                            {customer.updatedAt
                              ? new Date(
                                  customer.updatedAt
                                ).toLocaleString()
                              : "-"}
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                            <span className="font-medium text-slate-900">
                              Mobile:
                            </span>{" "}
                            {customer.mobile}
                          </div>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                            <h4 className="font-semibold">
                              {showingAllBills ? "All bills" : "Recent bills"}
                            </h4>
                            {!showingAllBills &&
                              Number(customer.billCount || 0) >
                                customerBills.length && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void loadCustomerBills(customer, true)
                                  }
                                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium hover:bg-slate-100"
                                >
                                  View all bills
                                </button>
                              )}
                          </div>

                          {loadingBillsFor === customer._id ? (
                            <div className="px-4 py-6 text-sm text-slate-500">
                              Loading recent bills...
                            </div>
                          ) : customerBills.length === 0 ? (
                            <div className="px-4 py-6 text-sm text-slate-500">
                              No bills found for this customer.
                            </div>
                          ) : (
                            <table className="min-w-full text-sm">
                              <thead className="bg-slate-100 text-slate-600">
                                <tr>
                                  <th className="px-4 py-3 text-left">
                                    Bill No
                                  </th>
                                  <th className="px-4 py-3 text-right">
                                    Final Total
                                  </th>
                                  <th className="px-4 py-3 text-right">
                                    Date
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {customerBills.map((bill) => (
                                  <tr
                                    key={bill._id}
                                    className="border-t border-slate-100"
                                  >
                                    <td className="px-4 py-3 font-medium">
                                      {bill.billNo}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      {formatINR(bill.finalTotal)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      {bill.createdAt
                                        ? new Date(
                                            bill.createdAt
                                          ).toLocaleDateString()
                                        : "-"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
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
  // caption,
}: {
  label: string;
  value: string;
  // caption: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-xl font-bold text-slate-900">
        {value}
      </div>
      {/* <div className="mt-1 text-xs text-slate-400">{caption}</div> */}
    </div>
  );
}
