"use client";

import { memo } from "react";

type Props = {
  previousBalance: number;
  amount: string;
  isSaving?: boolean;
  onAmountChange: (value: string) => void;
  onQuickAdd: (value: number) => void;
  onSave: (mode: "save" | "whatsapp") => void;
};

const quickAmounts = [100, 500, 1000];

function PaymentForm({
  previousBalance,
  amount,
  isSaving = false,
  onAmountChange,
  onQuickAdd,
  onSave,
}: Props) {
  const paidNow = Number(amount || 0);
  const remainingBalance = previousBalance - paidNow;
  const isFullyPaid = paidNow >= previousBalance && previousBalance > 0;
  const hasInvalidAmount =
    !amount.trim() ||
    !Number.isFinite(paidNow) ||
    paidNow <= 0 ||
    remainingBalance < 0;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200/80 pb-1.5">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900">Pay-Value </h3>
        </div>
        <div className="rounded-xl bg-rose-50 px-2.5 py-1.5 text-right flex gap-2">
          {/* <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-500">
            Current
          </p> */}
          <p className="font-bold  text-rose-700">Rs. {previousBalance}</p>
        </div>
      </div>

      <div className="flex flex-col-2 gap-1">
        <label className="text-sm self-center font-medium w-full text-slate-900">
          Amount Paid
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={amount}
          onChange={(event) =>
            onAmountChange(event.target.value.replace(/[^\d.]/g, ""))
          }
          placeholder="Enter amount"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
        />
      </div>

      <div className="grid grid-cols-4 gap-1">
        <button
          type="button"
          onClick={() => onAmountChange(String(previousBalance))}
          disabled={isFullyPaid}
          className={`rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
            isFullyPaid
              ? "border-slate-200 bg-slate-100 text-slate-400"
              : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
        >
          Pay Full
        </button>
        {quickAmounts.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onQuickAdd(value)}
            disabled={isFullyPaid}
            className={`rounded-xl border px-2.5 py-1.5 text-xs font-medium transition ${
              isFullyPaid
                ? "border-slate-200 bg-slate-100 text-slate-400"
                : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
            }`}
          >
            +{value}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm space-y-2">
        <div className="flex justify-between">
          <span className="text-slate-600">Previous Balance</span>
          <span className="font-medium text-slate-900">Rs. {previousBalance}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Paid Now</span>
          <span className="font-medium text-slate-900">Rs. {paidNow || 0}</span>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
          <span className="text-slate-900">Remaining Balance</span>
          <span className={remainingBalance < 0 ? "text-red-600" : "text-slate-900"}>
            Rs. {remainingBalance >= 0 ? remainingBalance : 0}
          </span>
        </div>
      </div>

      {remainingBalance < 0 && (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          Payment cannot exceed the current balance.
        </p>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={hasInvalidAmount || isSaving}
          onClick={() => onSave("save")}
          className={`rounded-xl py-2.5 text-sm font-semibold transition ${
            hasInvalidAmount || isSaving
              ? "bg-gray-300 text-gray-500"
              : "bg-green-600 text-white"
          }`}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>

        {/* <button
          type="button"
          disabled={hasInvalidAmount || isSaving}
          onClick={() => onSave("whatsapp")}
          className={`rounded-xl py-2.5 text-sm font-semibold transition ${
            hasInvalidAmount || isSaving
              ? "bg-gray-300 text-gray-500"
              : "bg-blue-600 text-white"
          }`}
        >
          {isSaving ? "Saving..." : "Save & Send WhatsApp"}
        </button> */}
      </div>
    </div>
  );
}

export default memo(PaymentForm);
