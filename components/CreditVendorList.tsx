
"use client";

import { memo } from "react";
import type { CreditVendorSummary } from "@/actions/credit";

type Props = {
  vendors: CreditVendorSummary[];
  search: string;
  isLoading: boolean;
  onSearchChange: (value: string) => void;
  onSelectVendor: (vendor: CreditVendorSummary) => void;
};
function CreditVendorList({
  vendors,
  search,
  isLoading,
  onSearchChange,
  onSelectVendor,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Pending Credit Vendors
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {vendors.length}
          </span>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search vendor name or mobile"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-sm placeholder-gray-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No vendors with pending credit
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try another search or come back after a credit estimate is created.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {vendors.map((vendor) => (
            <button
              key={vendor._id}
              type="button"
              onClick={() => onSelectVendor(vendor)}
              className="w-full bg-white border border-gray-200 rounded-xl p-3 text-left shadow-sm transition duration-200 hover:shadow-md hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1 text-xs text-slate-600">
                  <span className=" font-bold uppercase text-slate-900 truncate">{vendor.name}</span>
                  <span className="mx-2">•</span>
                  <span className="truncate uppercase">{vendor.city || "Unknown city"}</span>
                  {/* <span className="mx-2">•</span> */}
                  {/* <span className="truncate">{vendor.mobile || "-"}</span> */}
                </div>

                <div className="text-right text-xs flex gap-2 bg-rose-200 px-3 rounded-xl items-center">
                  {/* <p className="text-slate-500"></p> */}
                  <p className="text-sm font-semibold ">Rs. {vendor.balance}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(CreditVendorList);
