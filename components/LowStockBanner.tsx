"use client";

import { memo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type LowStockBannerProps = {
  count?: number;
  isLoading?: boolean;
};

const LowStockBanner = memo(function LowStockBanner({
  count: providedCount,
  isLoading = false,
}: LowStockBannerProps) {
  const [localCount, setLocalCount] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof providedCount === "number" || isLoading) {
      setLocalCount(null);
      return;
    }

    const controller = new AbortController();

    fetch("/api/reports/low-stock", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setLocalCount(Array.isArray(d) ? d.length : 0))
      .catch((error: any) => {
        if (error?.name === "AbortError") return;
        setLocalCount(0);
      });
    return () => controller.abort();
  }, [providedCount, isLoading]);

  const count =
    typeof providedCount === "number"
      ? providedCount
      : (localCount ?? 0);

  if (isLoading && typeof providedCount !== "number") {
    return (
      <div className="mb-4 flex items-center justify-between rounded border border-red-200 bg-red-50 p-3">
        <div className="h-4 w-32 animate-pulse rounded bg-red-200/70" />
        <div className="h-4 w-20 animate-pulse rounded bg-red-200/70" />
      </div>
    );
  }

  if (count === 0) return null;

  return (
    <div
      onClick={() => router.push("/inventory/low-stock")}
      className="mb-4 flex cursor-pointer items-center justify-between rounded border border-red-300 bg-red-100 p-3 text-red-800 hover:bg-red-200"
    >
      <span>
        ⚠️ <strong>{count}</strong> low stock
      </span>
      <span className="text-sm underline">
        View details →
      </span>
    </div>
  );
});

export default LowStockBanner;
