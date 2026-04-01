"use client";

import { memo } from "react";

export type PaymentMethodValue = "cash" | "upi" | "split";

type Props = {
  value: PaymentMethodValue;
  onChange: (value: PaymentMethodValue) => void;
  total: number;
  cashAmount: number;
  upiAmount: number;
  onCashAmountChange: (value: number) => void;
  disabled?: boolean;
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

function PaymentMethod({
  value,
  onChange,
  total,
  cashAmount,
  upiAmount,
  onCashAmountChange,
  disabled = false,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {(["cash", "upi", "split"] as PaymentMethodValue[]).map(
          (method) => (
            <button
              key={method}
              type="button"
              disabled={disabled}
              onClick={() => onChange(method)}
              className={`rounded-2xl border px-3 py-3 text-sm font-semibold capitalize transition ${
                value === method
                  ? "border-sky-600 bg-sky-600 text-white"
                  : "border-slate-200 bg-white text-slate-700"
              } ${disabled ? "opacity-60" : ""}`}
            >
              {method}
            </button>
          )
        )}
      </div>

      {value === "split" && (
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">
              Cash Amount
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={cashAmount === 0 ? "" : String(cashAmount)}
              disabled={disabled}
              placeholder="0"
              onChange={(event) => {
                const nextValue = event.target.value.replace(/[^0-9.]/g, "");
                onCashAmountChange(Number(nextValue || 0));
              }}
              onKeyDown={(event) => {
                if (event.ctrlKey || event.metaKey) return;
                if (
                  !/^\d$/.test(event.key) &&
                  !["."].concat(numberKeys).includes(event.key)
                ) {
                  event.preventDefault();
                }
              }}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none ring-0 focus:border-sky-500"
            />
          </label>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm font-medium text-emerald-700">
              UPI Amount
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">
              Rs.{upiAmount}
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              Split total: Rs.{total}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(PaymentMethod);
