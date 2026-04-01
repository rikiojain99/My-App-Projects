"use client";

import { memo } from "react";

type Props = {
  oldBalance: number;
  newBill: number;
  newTotal: number;
};

function CreditSummary({ oldBalance, newBill, newTotal }: Props) {
  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-800">
        Credit Summary
      </h3>

      <div className="mt-4 grid gap-3">
        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
          <span className="text-sm text-slate-600">Old Balance</span>
          <span className="text-lg font-bold text-slate-900">
            Rs.{oldBalance}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
          <span className="text-sm text-slate-600">New Estimate</span>
          <span className="text-lg font-bold text-slate-900">
            Rs.{newBill}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-amber-100 px-4 py-3">
          <span className="text-sm font-semibold text-amber-900">
            New Total
          </span>
          <span className="text-2xl font-bold text-amber-950">
            Rs.{newTotal}
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(CreditSummary);
