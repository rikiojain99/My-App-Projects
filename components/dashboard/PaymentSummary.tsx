"use client";

import { useEffect, useState } from "react";

export default function PaymentSummary() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/reports/payment-summary")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        Loading payment summary...
      </div>
    );
  }

  const Card = ({
    title,
    color,
    value,
    count,
  }: any) => (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <div className="text-xs text-gray-500">
        {title}
      </div>

      <div
        className={`text-lg font-bold mt-1 ${color}`}
      >
        ₹ {value}
      </div>

      <div className="text-xs text-gray-400 mt-1">
        {count} bills
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-600">
        Payment Summary
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card
          title="Cash"
          color="text-green-600"
          value={data.cash.total}
          count={data.cash.count}
        />

        <Card
          title="UPI"
          color="text-blue-600"
          value={data.upi.total}
          count={data.upi.count}
        />

        <Card
          title="Split"
          color="text-purple-600"
          value={data.split.total}
          count={data.split.count}
        />
      </div>
    </div>
  );
}
