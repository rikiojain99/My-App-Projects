"use client";

import { useState, useMemo } from "react";

type Props = {
  dailySale: any;
  closing: boolean;
  onCloseDay: () => void;
};

export default function DailySaleSummary({
  dailySale,
  closing,
  onCloseDay,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const totalAmount =
    dailySale.totalAmount ??
    dailySale.totalRevenue ??
    0;

  const totalCash = dailySale.totalCash ?? 0;
  const totalUpi = dailySale.totalUpi ?? 0;

  const entries =
    dailySale.entries ||
    dailySale.transactions ||
    [];

  const totalTransactions = entries.length;

  const lastThree = useMemo(() => {
    return [...entries]
      .reverse()
      .slice(0, 3);
  }, [entries]);

  return (
    <div className="bg-white border rounded-2xl shadow-sm transition-all">
      <div className="flex justify-between items-center p-4">
        <div>
          <h2 className="font-semibold text-lg">
            Today's Fast Sales
            <span className="ml-2 text-sm text-gray-500">
              Estimates ({totalTransactions})
            </span>
          </h2>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="px-3 py-1 text-sm bg-gray-100 rounded-lg"
        >
          {expanded ? "Minimize" : "Expand"}
        </button>
      </div>

      {expanded && (
        <div className="border-t px-4 py-4 space-y-5 bg-gray-50 rounded-b-2xl">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <SummaryItem label="Total Amount" value={totalAmount} />
            <SummaryItem label="Cash" value={totalCash} />
            <SummaryItem label="UPI" value={totalUpi} />
          </div>

          {lastThree.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">
                Recent Fast Sales
              </h3>

              <div className="space-y-1">
                {lastThree.map(
                  (entry: any, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between bg-white border rounded-lg px-3 py-2 text-sm"
                    >
                      <div>Rs. {entry.total}</div>

                      <div className="text-gray-500 text-xs">
                        {entry.items?.length || 0} items
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          <button
            onClick={onCloseDay}
            disabled={closing}
            className="w-full py-2 bg-green-600 text-white rounded-xl font-medium disabled:opacity-50"
          >
            {closing ? "Closing..." : "Close Day"}
          </button>
        </div>
      )}
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white border rounded-xl p-3 text-center shadow-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-semibold text-lg mt-1">Rs. {value}</div>
    </div>
  );
}