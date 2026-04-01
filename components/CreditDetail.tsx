"use client";

import Link from "next/link";
import { memo, useState } from "react";
import type { CreditVendorDetail as CreditVendorDetailType } from "@/actions/credit";

type Props = {
  detail: CreditVendorDetailType;
  isLoading?: boolean;
  onBack: () => void;
};

function CreditDetail({ detail, isLoading = false, onBack }: Props) {
  const [activityExpanded, setActivityExpanded] = useState(false);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="space-y-1">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
        <div className="border-b border-slate-200/80 bg-slate-50 px-2.5 py-2 sm:px-3 sm:py-3">
          <div className="flex flex-wrap items-start justify-between gap-1.5">
            <div className="min-w-0 flex-2 items-center-safe flex gap-2">
              <p className="mt-1 truncate text-lg font-semibold text-slate-900">
                Credit Detail-
              </p>
              <h2 className="mt-1 uppercase truncate text-lg font-bold text-slate-900">
                {detail.vendor.name}
              </h2>
            </div>

            <div className="flex gap-2 items-center rounded-2xl bg-rose-50 px-2.5 py-1.5 text-right">
              <p className="text-base font-semibold text-rose-700">
                Balance
              </p>
              <p className="text-base font-bold text-rose-700">
                Rs. {detail.vendor.balance}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3  p-3 sm:space-y-4 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-600">
              Vendor details
            </p>

            <div className="flex items-center gap-2">
              <Link
                href={`/vendors/view-estimates?vendorId=${detail.vendor._id}&vendorName=${encodeURIComponent(detail.vendor.name)}`}
                className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                View Estimates
              </Link>
              <button
                type="button"
                onClick={onBack}
                className="rounded-full border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Back
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1">
              {detail.vendor.city || "Unknown city"}
            </span>
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1">
              {detail.vendor.mobile || "No mobile"}
            </span>
            <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1">
              Rs. {detail.vendor.balance}
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-200 px-2.5 py-2 sm:px-3 sm:py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Recent Activity </h3>
            
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            Last 100
          </span>
          </div>
        <button
              type="button"
              onClick={() => setActivityExpanded((current) => !current)}
              className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-300 hover:bg-slate-100 transition text-xs font-bold"
            >
              {activityExpanded ? "-" : "+"}
            </button>
        </div>

        {activityExpanded && (
          <>
            {isLoading ? (
              <div className="space-y-2 p-3 sm:p-4 max-h-[42vh] overflow-y-auto">
                {Array.from({ length: 100 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-16 rounded-2xl border border-slate-200 bg-slate-100 animate-pulse"
                  />
                ))}
              </div>
            ) : detail.transactions.length === 0 ? (
              <div className="p-4 text-center sm:p-6">
                <p className="text-sm font-medium text-slate-700">No recent activity</p>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Payments and new credit entries will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2 p-3 sm:space-y-3 sm:p-4 max-h-[42vh] overflow-y-auto">
                {[...detail.transactions]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((transaction) => (
                  <div
                    key={transaction._id}
                    className={`rounded-2xl border p-3 shadow-sm ${
                      transaction.type === "payment"
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-rose-200 bg-rose-50"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className={`rounded-full px-2 py-0.5 font-semibold uppercase tracking-[0.14em] ${
                              transaction.type === "payment"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {transaction.type === "payment" ? "Payment" : "Credit"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatDate(transaction.createdAt)}
                          </span>
                        </div>

     {/*   to much text in note can break the layout,

                        <p className="mt-1 font-semibold text-slate-900 text-sm">
                          {transaction.type === "payment" ? "Payment Received" : "Credit Added"}
                        </p>

                        {transaction.note && (
                          <p className="mt-1 wrap-break-word text-xs text-slate-600 sm:text-sm">
                            {transaction.note}
                          </p>
                        )} */}
                      </div>

                      <p
                        className={`shrink-0 text-right text-base font-bold ${
                          transaction.type === "payment" ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        Rs. {transaction.amount}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default memo(CreditDetail);
