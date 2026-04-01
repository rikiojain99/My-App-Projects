"use client";

import { useEffect, useMemo, useState } from "react";
import CreditSummary from "@/components/CreditSummary";
import PaymentMethod, {
  type PaymentMethodValue,
} from "@/components/PaymentMethod";

type Props = {
  open: boolean;
  vendorName: string;
  deliveredBy: string;
  total: number;
  discount: number;
  finalTotal: number;
  oldBalance: number;
  paymentType: "paid" | "credit";
  paymentMethod: PaymentMethodValue;
  cashAmount: number;
  upiAmount: number;
  isSaving?: boolean;
  onClose: () => void;
  onDiscountChange: (value: number) => void;
  onPaymentTypeChange: (value: "paid" | "credit") => void;
  onPaymentMethodChange: (value: PaymentMethodValue) => void;
  onCashAmountChange: (value: number) => void;
  onSave: (mode: "save" | "whatsapp") => void | Promise<void>;
};

const numberKeys = [
  "Backspace",
  "Delete",
  "ArrowLeft",
  "ArrowRight",
  "Tab",
  "Home",
  "End",
];

export default function PaymentModal({
  open,
  vendorName,
  deliveredBy,
  total,
  discount,
  finalTotal,
  oldBalance,
  paymentType,
  paymentMethod,
  cashAmount,
  upiAmount,
  isSaving = false,
  onClose,
  onDiscountChange,
  onPaymentTypeChange,
  onPaymentMethodChange,
  onCashAmountChange,
  onSave,
}: Props) {
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (open) {
      setStep(1);
    }
  }, [open]);

  const stepTitle = useMemo(() => {
    if (step === 1) return "Discount";
    if (step === 2) return "Payment";
    return "Confirm";
  }, [step]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-gray-500">
              Step {step} of 3
            </p>
            <h2 className="mt-1 text-lg font-semibold text-black">
              {stepTitle}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            Close
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          {[1, 2, 3].map((value) => (
            <div
              key={value}
              className={`h-2 flex-1 rounded-full ${
                value <= step ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="mt-5 space-y-4">
            <div className="bg-gray-50 border rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="mt-1 text-3xl font-bold text-green-600">
                Rs.{total}
              </p>
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-medium">
                Discount
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={discount === 0 ? "" : String(discount)}
                onChange={(event) =>
                  onDiscountChange(
                    Number(
                      event.target.value.replace(/[^0-9.]/g, "") || 0
                    )
                  )
                }
                onKeyDown={(event) => {
                  if (event.ctrlKey || event.metaKey) return;
                  if (
                    !/^\d$/.test(event.key) &&
                    !["."].concat(numberKeys).includes(event.key)
                  ) {
                    event.preventDefault();
                  }
                }}
                className="w-full border rounded-lg p-2"
                placeholder="Discount amount"
              />
            </label>

            <div className="bg-green-50 border rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500">Final Total</p>
              <p className="mt-1 text-3xl font-bold text-green-600">
                Rs.{finalTotal}
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {([
                ["paid", "Pay Now"],
                ["credit", "Credit"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onPaymentTypeChange(value)}
                  className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                    paymentType === value
                      ? "bg-blue-600 text-white"
                      : "border bg-white text-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {paymentType === "paid" ? (
              <PaymentMethod
                value={paymentMethod}
                onChange={onPaymentMethodChange}
                total={finalTotal}
                cashAmount={cashAmount}
                upiAmount={upiAmount}
                onCashAmountChange={onCashAmountChange}
                disabled={isSaving}
              />
            ) : (
              <CreditSummary
                oldBalance={oldBalance}
                newBill={finalTotal}
                newTotal={oldBalance + finalTotal}
              />
            )}
          </div>
        )}

        {step === 3 && (
          <div className="mt-5 space-y-4">
            <div className="bg-gray-50 border rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500">
                Vendor
              </p>
              <p className="mt-1 text-xl font-bold text-black">
                {vendorName}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Delivered By: {deliveredBy || "Not added"}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border px-4 py-3">
                <p className="text-sm text-gray-500">Final Total</p>
                <p className="mt-1 text-2xl font-bold text-black">
                  Rs.{finalTotal}
                </p>
              </div>

              <div className="rounded-xl border px-4 py-3">
                <p className="text-sm text-gray-500">Payment</p>
                <p className="mt-1 text-2xl font-bold text-black">
                  {paymentType === "credit"
                    ? "Credit"
                    : paymentMethod.toUpperCase()}
                </p>
              </div>
            </div>

            {paymentType === "credit" && (
              <CreditSummary
                oldBalance={oldBalance}
                newBill={finalTotal}
                newTotal={oldBalance + finalTotal}
              />
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => onSave("save")}
                className={`rounded-lg px-4 py-3 text-sm font-semibold ${
                  isSaving
                    ? "bg-gray-200 text-gray-400"
                    : "bg-green-600 text-white"
                }`}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => onSave("whatsapp")}
                className={`rounded-lg px-4 py-3 text-sm font-semibold ${
                  isSaving
                    ? "bg-green-100 text-green-400"
                    : "bg-blue-600 text-white"
                }`}
              >
                {isSaving ? "Saving..." : "Save & Send WhatsApp"}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={step === 1 || isSaving}
            onClick={() => setStep((current) => Math.max(current - 1, 1))}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold ${
              step === 1 || isSaving
                ? "border-gray-200 text-gray-300"
                : "border-gray-300 text-gray-700"
            }`}
          >
            Back
          </button>

          {step < 3 && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setStep((current) => Math.min(current + 1, 3))}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
