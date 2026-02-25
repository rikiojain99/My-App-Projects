"use client";

import { useEffect } from "react";

type Props = {
  vendorName: string;

  grandTotal: number;

  discount: number;
  setDiscount: (n: number) => void;

  finalTotal: number;

  cashPaid: number;
  setCashPaid: (n: number) => void;

  creditAmount: number;

  onBack: () => void;
  onSave: () => void;
};

export default function VendorPaymentModal({
  vendorName,
  grandTotal,
  discount,
  setDiscount,
  finalTotal,
  cashPaid,
  setCashPaid,
  creditAmount,
  onBack,
  onSave,
}: Props) {
  const numberKeys = [
    "Backspace",
    "Delete",
    "ArrowLeft",
    "ArrowRight",
    "Tab",
    "Home",
    "End",
  ];

  /* ================= AUTO VALIDATION ================= */

  useEffect(() => {
    if (cashPaid > finalTotal) {
      setCashPaid(finalTotal);
    }
  }, [cashPaid, finalTotal]);

  /* ================= UI ================= */

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">

      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl 
                      max-h-[90vh] overflow-y-auto p-6 space-y-6">

        {/* HEADER */}
        <div className="text-center">
          <h2 className="text-lg font-semibold">
            Vendor Payment
          </h2>
          <p className="text-xl font-bold">
            {vendorName}
          </p>
        </div>

        {/* GRAND TOTAL */}
        <div className="bg-gray-50 border rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">
            Grand Total
          </p>
          <p className="text-2xl font-bold">
            ₹ {grandTotal}
          </p>
        </div>

        {/* DISCOUNT */}
        <div>
          <label className="text-sm font-medium block mb-1">
            Discount (₹)
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={discount === 0 ? "" : String(discount)}
            onChange={(e) =>
              setDiscount(
                Number(e.target.value.replace(/\D/g, "")) || 0
              )
            }
            onKeyDown={(e) => {
              if (e.ctrlKey || e.metaKey) return;
              if (!/^\d$/.test(e.key) && !numberKeys.includes(e.key)) {
                e.preventDefault();
              }
            }}
            className="w-full border rounded-lg p-2"
            placeholder="Enter discount"
          />
        </div>

        {/* FINAL TOTAL */}
        <div className="bg-green-50 border rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">
            Final Payable
          </p>
          <p className="text-2xl font-bold text-green-600">
            ₹ {finalTotal}
          </p>
        </div>

        {/* CASH PAID */}
        <div>
          <label className="text-sm font-medium block mb-1">
            Cash Received
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={cashPaid === 0 ? "" : String(cashPaid)}
            onChange={(e) =>
              setCashPaid(
                Number(e.target.value.replace(/\D/g, "")) || 0
              )
            }
            onKeyDown={(e) => {
              if (e.ctrlKey || e.metaKey) return;
              if (!/^\d$/.test(e.key) && !numberKeys.includes(e.key)) {
                e.preventDefault();
              }
            }}
            className="w-full border rounded-lg p-2"
            placeholder="Enter cash received"
          />
        </div>

        {/* CREDIT DISPLAY */}
        <div className="bg-yellow-50 border rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">
            Credit (Remaining)
          </p>
          <p className="text-2xl font-bold text-yellow-600">
            ₹ {creditAmount}
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3 pt-3">
          <button
            onClick={onBack}
            className="flex-1 border rounded-lg py-2"
          >
            Back
          </button>

          <button
            onClick={onSave}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 font-semibold"
          >
            Save Sale
          </button>
        </div>

      </div>
    </div>
  );
}
