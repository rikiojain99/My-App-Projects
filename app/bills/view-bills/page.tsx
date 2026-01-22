"use client";
import { useEffect, useState } from "react";

export default function ViewBills() {
  const [bills, setBills] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState("");
  const [editingBill, setEditingBill] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  /* ---------------- FETCH ---------------- */
  async function fetchBills(newPage = 1) {
    const res = await fetch(`/api/bills?page=${newPage}&limit=15`);
    const data = await res.json();

    if (newPage === 1) setBills(data.bills);
    else setBills((p) => [...p, ...data.bills]);

    setPage(data.currentPage);
    setHasMore(data.currentPage < data.totalPages);
  }

  useEffect(() => {
    fetchBills(1);

    const onScroll = () => {
      if (
        window.innerHeight + window.scrollY + 120 >=
        document.body.offsetHeight
      ) {
        if (hasMore) fetchBills(page + 1);
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [page, hasMore]);

  /* ---------------- FILTER ---------------- */
  const filteredBills = bills.filter(
    (b) =>
      b.customerId?.name
        ?.toLowerCase()
        .includes(filter.toLowerCase()) ||
      b.customerId?.mobile?.includes(filter)
  );

  /* ---------------- UPDATE ---------------- */
  async function handleUpdate() {
    setLoading(true);

    await fetch("/api/bills", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        billId: editingBill._id,
        updates: {
          items: editingBill.items,
          discount: editingBill.discount,
          grandTotal: editingBill.grandTotal,
          finalTotal: editingBill.finalTotal,
        },
        customerUpdates: editingBill.customerId,
      }),
    });

    setLoading(false);
    setEditingBill(null);
    fetchBills(1);
  }

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-4">
        {/* HEADER */}
        <h1 className="text-xl font-semibold text-black mb-3">
          Bills
        </h1>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search customer / mobile"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full p-3 border rounded-md mb-4"
        />

        {/* LIST */}
        <div className="bg-white border rounded-md divide-y">
          {filteredBills.map((bill) => (
            <div
              key={bill._id}
              className="flex justify-between items-center px-4 py-3 hover:bg-gray-50"
            >
              {/* LEFT */}
              <div>
                <p className="font-medium text-black">
                  {bill.customerId?.name}{" "}
                  <span className="text-gray-500 text-sm">
                    ({bill.customerId?.mobile})
                  </span>
                </p>

                <p className="text-xs text-gray-500">
                  Bill #{bill.billNo}
                </p>

                <p className="text-xs text-gray-500 mt-0.5">
                  {bill.paymentMode?.toUpperCase() || "CASH"}
                  {bill.paymentMode === "split" &&
                    ` • Cash ₹${bill.cashAmount} • UPI ₹${bill.upiAmount}`}
                </p>
              </div>

              {/* RIGHT */}
              <div className="text-right">
                <p className="font-semibold text-black">
                  ₹ {bill.finalTotal ?? bill.grandTotal}
                </p>

                {bill.discount > 0 && (
                  <p className="text-xs text-gray-500">
                    Discount ₹{bill.discount}
                  </p>
                )}

                <button
                  onClick={() => setEditingBill(bill)}
                  className="text-sm text-blue-600 hover:underline mt-1"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= EDIT MODAL ================= */}
      {editingBill && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-md p-5">
            <h2 className="text-lg font-semibold mb-4">
              Edit Bill
            </h2>

            {/* CUSTOMER */}
            {["name", "mobile", "city", "type"].map((f) => (
              <input
                key={f}
                value={editingBill.customerId[f]}
                onChange={(e) =>
                  setEditingBill({
                    ...editingBill,
                    customerId: {
                      ...editingBill.customerId,
                      [f]: e.target.value,
                    },
                  })
                }
                className="w-full border p-2 mb-2 rounded"
                placeholder={f}
              />
            ))}

            {/* ITEMS (QTY ONLY) */}
            {editingBill.items.map((it: any, i: number) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  value={it.name}
                  readOnly
                  className="flex-1 border p-2 rounded bg-gray-50"
                />
                <input
                  type="number"
                  value={it.qty}
                  onChange={(e) => {
                    const items = [...editingBill.items];
                    items[i].qty = Number(e.target.value);
                    items[i].total =
                      items[i].qty * items[i].rate;

                    const gt = items.reduce(
                      (s, x) => s + x.total,
                      0
                    );

                    setEditingBill({
                      ...editingBill,
                      items,
                      grandTotal: gt,
                      finalTotal: gt - (editingBill.discount || 0),
                    });
                  }}
                  className="w-20 border p-2 rounded"
                />
              </div>
            ))}

            {/* DISCOUNT */}
            <input
              type="number"
              value={editingBill.discount || 0}
              onChange={(e) => {
                const d = Number(e.target.value);
                setEditingBill({
                  ...editingBill,
                  discount: d,
                  finalTotal:
                    editingBill.grandTotal - d,
                });
              }}
              className="w-full border p-2 rounded mt-2"
              placeholder="Discount"
            />

            <p className="mt-3 font-semibold">
              Final: ₹{editingBill.finalTotal}
            </p>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setEditingBill(null)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                {loading ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
