"use client";

import { useState, useEffect } from "react";

export default function BillEditModal({
  bill,
  onClose,
  onUpdated,
}: any) {
  const [loading, setLoading] = useState(false);
  const [editingBill, setEditingBill] = useState<any | null>(null);

  useEffect(() => {
    setEditingBill(bill);
  }, [bill]);

  if (!editingBill) return null;

  /* ================= ITEM QTY CHANGE ================= */
  const handleQtyChange = (index: number, qty: number) => {
    const items = [...editingBill.items];
    items[index].qty = qty;
    items[index].total = qty * items[index].rate;

    const grandTotal = items.reduce(
      (sum: number, i: any) => sum + i.total,
      0
    );

    setEditingBill({
      ...editingBill,
      items,
      grandTotal,
      finalTotal: grandTotal - (editingBill.discount || 0),
    });
  };

  /* ================= DISCOUNT ================= */
  const handleDiscountChange = (value: number) => {
    setEditingBill({
      ...editingBill,
      discount: value,
      finalTotal: editingBill.grandTotal - value,
    });
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
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
          paymentMode: editingBill.paymentMode,
          cashAmount: editingBill.cashAmount,
          upiAmount: editingBill.upiAmount,
          upiId: editingBill.upiId,
          upiAccount: editingBill.upiAccount,
        },
        customerUpdates: editingBill.customerId,
      }),
    });

    setLoading(false);
    onClose();
    onUpdated(1);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">

        <h2 className="text-lg font-semibold">Edit Bill</h2>

        {/* ================= CUSTOMER ================= */}
        {["name", "mobile", "city", "type"].map((field) => (
          <input
            key={field}
            value={editingBill.customerId?.[field] || ""}
            onChange={(e) =>
              setEditingBill({
                ...editingBill,
                customerId: {
                  ...editingBill.customerId,
                  [field]: e.target.value,
                },
              })
            }
            className="w-full border p-2 rounded"
            placeholder={field}
          />
        ))}

        {/* ================= ITEMS ================= */}
        <div className="space-y-2">
          {editingBill.items.map((it: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1 text-sm">{it.name}</div>

              <input
                type="number"
                value={it.qty}
                onChange={(e) =>
                  handleQtyChange(i, Number(e.target.value))
                }
                className="w-20 border p-1 rounded"
              />

              <div className="text-sm w-16 text-right">
                ₹ {it.total}
              </div>
            </div>
          ))}
        </div>

        {/* ================= DISCOUNT ================= */}
        <div>
          <label className="text-sm text-gray-500">
            Discount
          </label>
          <input
            type="number"
            value={editingBill.discount || 0}
            onChange={(e) =>
              handleDiscountChange(Number(e.target.value))
            }
            className="w-full border p-2 rounded"
          />
        </div>

        {/* ================= PAYMENT EDIT ================= */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Payment Mode</p>

          {["cash", "upi", "split"].map((mode) => (
            <label key={mode} className="flex gap-2 text-sm">
              <input
                type="radio"
                checked={editingBill.paymentMode === mode}
                onChange={() =>
                  setEditingBill({
                    ...editingBill,
                    paymentMode: mode,
                  })
                }
              />
              {mode.toUpperCase()}
            </label>
          ))}

          {editingBill.paymentMode !== "upi" && (
            <input
              type="number"
              placeholder="Cash Amount"
              value={editingBill.cashAmount || 0}
              onChange={(e) =>
                setEditingBill({
                  ...editingBill,
                  cashAmount: Number(e.target.value),
                })
              }
              className="w-full border p-2 rounded"
            />
          )}

          {editingBill.paymentMode !== "cash" && (
            <>
              <input
                type="number"
                placeholder="UPI Amount"
                value={editingBill.upiAmount || 0}
                onChange={(e) =>
                  setEditingBill({
                    ...editingBill,
                    upiAmount: Number(e.target.value),
                  })
                }
                className="w-full border p-2 rounded"
              />

              <input
                type="text"
                placeholder="UPI ID"
                value={editingBill.upiId || ""}
                onChange={(e) =>
                  setEditingBill({
                    ...editingBill,
                    upiId: e.target.value,
                  })
                }
                className="w-full border p-2 rounded"
              />

              <input
                type="text"
                placeholder="UPI Account"
                value={editingBill.upiAccount || ""}
                onChange={(e) =>
                  setEditingBill({
                    ...editingBill,
                    upiAccount: e.target.value,
                  })
                }
                className="w-full border p-2 rounded"
              />
            </>
          )}
        </div>

        {/* ================= TOTAL ================= */}
        <div className="border-t pt-2 text-sm">
          <div className="flex justify-between">
            <span>Grand</span>
            <span>₹ {editingBill.grandTotal}</span>
          </div>

          <div className="flex justify-between font-semibold">
            <span>Final</span>
            <span>₹ {editingBill.finalTotal}</span>
          </div>
        </div>

        {/* ================= ACTIONS ================= */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border rounded py-2"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white rounded py-2"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
