"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LowStockBanner() {
  const [count, setCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/reports/low-stock")
      .then((r) => r.json())
      .then((d) => setCount(d.length || 0));
  }, []);

  if (count === 0) return null;

  return (
    <div
      onClick={() => router.push("/inventory/low-stock")}
      className="cursor-pointer bg-red-100 border  border-red-300 text-red-800 p-3 mb-4 rounded flex justify-between items-center hover:bg-red-200"
    >
      <span>
        ⚠️ <strong>{count}</strong> low stock
      </span>
      <span className="text-sm underline">
        View details →
      </span>
    </div>
  );
}
