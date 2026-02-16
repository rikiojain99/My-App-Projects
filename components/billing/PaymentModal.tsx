"use client";

import { useEffect, useState } from "react";

type PaymentMode = "cash" | "upi" | "split";

type Props = {
  customerName: string;
  finalTotal: number;

  discount: number;
  setDiscount: (n: number) => void;

  paymentMode: PaymentMode;
  setPaymentMode: (m: PaymentMode) => void;

  cashAmount: number;
  setCashAmount: (n: number) => void;

  upiAmount: number;
  setUpiAmount: (n: number) => void;

  upiId: string;
  setUpiId: (v: string) => void;

  upiAccount: string;
  setUpiAccount: (v: string) => void;

  onBack: () => void;
  onSave: () => void;
};

export default function PaymentModal({
  customerName,
  finalTotal,
  discount,
  setDiscount,
  paymentMode,
  setPaymentMode,
  cashAmount,
  setCashAmount,
  upiAmount,
  setUpiAmount,
  upiId,
  setUpiId,
  upiAccount,
  setUpiAccount,
  onBack,
  onSave,
}: Props) {

  const [localDiscount, setLocalDiscount] = useState(
    discount.toString()
  );

  const upiAccounts = ["ID-1", "ID-2", "ID-3"];

  /* ================= SYNC DISCOUNT ================= */

  useEffect(() => {
    const num = Number(localDiscount);
    if (!isNaN(num)) {
      setDiscount(num);
    }
  }, [localDiscount]);

  /* ================= AUTO PAYMENT ================= */

  useEffect(() => {
    if (paymentMode === "cash") {
      setCashAmount(finalTotal);
      setUpiAmount(0);
    }

    if (paymentMode === "upi") {
      setCashAmount(0);
      setUpiAmount(finalTotal);
    }

    if (paymentMode === "split") {
      setCashAmount(finalTotal);
      setUpiAmount(0);
    }
  }, [paymentMode, finalTotal]);

  /* ================= SPLIT LIVE ================= */

  useEffect(() => {
    if (paymentMode === "split") {
      const remaining = finalTotal - cashAmount;
      setUpiAmount(remaining > 0 ? remaining : 0);
    }
  }, [cashAmount, finalTotal, paymentMode]);

  const isValid =
    paymentMode === "cash"
      ? cashAmount === finalTotal
      : paymentMode === "upi"
      ? upiAmount === finalTotal && upiAccount
      : cashAmount + upiAmount === finalTotal;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">

      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl 
                      max-h-[90vh] overflow-y-auto p-6 space-y-6">

        <div className="text-center">
          <h2 className="text-lg font-semibold">
            Payment
          </h2>
          <p className="text-xl font-bold">
            {customerName || "Walk-in Customer"}
          </p>
        </div>

        <div className="bg-gray-50 border rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">Final Amount</p>
          <p className="text-3xl font-bold text-green-600">
            ₹ {finalTotal}
          </p>
        </div>

        {/* DISCOUNT */}
        <div>
          <label className="text-sm font-medium block mb-1">
            Discount (₹)
          </label>
          <input
            type="number"
            value={localDiscount}
            onChange={(e) =>
              setLocalDiscount(e.target.value)
            }
            className="w-full border rounded-lg p-2"
          />
        </div>

        {/* PAYMENT MODE */}
        <div className="flex gap-2">
          {(["cash", "upi", "split"] as PaymentMode[]).map(
            (m) => (
              <button
                key={m}
                onClick={() => setPaymentMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm ${
                  paymentMode === m
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100"
                }`}
              >
                {m.toUpperCase()}
              </button>
            )
          )}
        </div>

        {/* CASH */}
        {(paymentMode === "cash" ||
          paymentMode === "split") && (
          <input
            type="number"
            value={cashAmount}
            onChange={(e) =>
              setCashAmount(Number(e.target.value))
            }
            className="w-full border rounded-lg p-2"
            placeholder="Cash Amount"
          />
        )}

        {/* UPI */}
        {(paymentMode === "upi" ||
          paymentMode === "split") && (
          <div className="space-y-3">

            <div className="bg-gray-100 p-2 rounded-lg text-sm">
              UPI Amount: ₹ {upiAmount}
            </div>

            <select
              value={upiAccount}
              onChange={(e) =>
                setUpiAccount(e.target.value)
              }
              className="w-full border rounded-lg p-2"
            >
              <option value="">Select UPI Account</option>
              {upiAccounts.map((acc) => (
                <option key={acc} value={acc}>
                  {acc}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={upiId}
              onChange={(e) =>
                setUpiId(e.target.value)
              }
              className="w-full border rounded-lg p-2"
              placeholder="Customer UPI ID (optional)"
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 border rounded-lg py-2"
          >
            Back
          </button>

          <button
            disabled={!isValid}
            onClick={onSave}
            className={`flex-1 rounded-lg py-2 font-semibold ${
              isValid
                ? "bg-green-600 text-white"
                : "bg-gray-300 text-gray-500"
            }`}
          >
            Save Bill
          </button>
        </div>

      </div>
    </div>
  );
}
