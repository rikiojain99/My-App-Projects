"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    fetch("/api/reports/low-stock")
      .then((r) => r.json())
      .then((d) => setLowStockCount(d.length || 0))
      .catch(() => {});
  }, []);

  const nav = [
    { label: "Dashboard", path: "/" },
    { label: "Bills", path: "/bills/view-bills" },
    { label: "Inventory", path: "/inventory/stockView" },
    { label: "Reports", path: "/stock-report" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* LEFT */}
        <div
          onClick={() => router.push("/")}
          className="font-semibold cursor-pointer flex items-center gap-2"
        >
          🏪 <span className="hidden sm:inline">SJ Light Houes</span>
        </div>

        {/* CENTER NAV */}
        <nav className="flex gap-2">
          {nav.map((n) => {
            const active = pathname === n.path;

            return (
              <button
                key={n.path}
                onClick={() => router.push(n.path)}
                className={`px-3 py-1.5 rounded text-sm ${
                  active
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {n.label}
              </button>
            );
          })}
        </nav>

        {/* RIGHT */}
        <div className="flex items-center gap-4">
          
          {/* Logout */}
          <button
            onClick={logout}
            className="text-sm text-red-600 hover:underline"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
