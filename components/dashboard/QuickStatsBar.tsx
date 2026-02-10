"use client";

import { useEffect, useState } from "react";

export default function QuickStatsBar() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/reports/dashboard")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded shadow text-center">
          Loading...
        </div>
      </div>
    );
  }

  const Card = ({ title, data }: any) => (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="text-xs text-gray-500">
        {title}
      </div>
      <div className="text-lg font-bold">
        ₹ {data.total || 0}
      </div>
      <div className="text-xs text-gray-400">
        {data.count || 0} bills
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card title="Today" data={stats.today} />
      <Card title="Last 7 Days" data={stats.week} />
      <Card title="This Month" data={stats.month} />
      <Card title="Overall" data={stats.overall} />
    </div>
  );
}
    