"use client";

import { memo } from "react";

type Props = {
  total: number;
  itemCount: number;
  disabled?: boolean;
  onNext: () => void;
};

function StickyFooter({
  total,
  itemCount,
  disabled = false,
  onNext,
}: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 shadow-lg">
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <div className="flex-1 rounded-xl border bg-gray-50 p-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold">🧾 Grand Total</span>
            <span className="font-bold text-lg">Rs. {total}</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">{itemCount} items</p>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={onNext}
          className={`rounded-xl px-5 py-4 text-sm font-bold ${
            disabled
              ? "bg-gray-200 text-gray-400"
              : "bg-blue-600 text-white"
          }`}
        >
          Next ➜
        </button>
      </div>
    </div>
  );
}

export default memo(StickyFooter);
