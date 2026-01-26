"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { authenticated, logout } = useAuth();
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    if (!authenticated) return;

    fetch("/api/reports/low-stock")
      .then((r) => r.json())
      .then((d) => setLowStockCount(Array.isArray(d) ? d.length : 0))
      .catch(() => {});
  }, [authenticated]);

  if (!authenticated) return null;

  const nav = [
    { label: "Dashboard", path: "/" },
    { label: "Bills", path: "/bills/view-bills" },
    { label: "Inventory", path: "/inventory/stockView" },
    { label: "Reports", path: "/stock-report" },
  ];

  const handleLogout = () => {
    document.cookie = "auth=; path=/; max-age=0";
    logout();
    router.replace("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b mb-2">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* LOGO */}
        <Link href="/" className="font-semibold flex items-center gap-2">
          🏪 <span className="hidden sm:inline">SJ Light House</span>
        </Link>

        {/* NAV */}
        <nav className="flex gap-2">
          {nav.map((n) => {
            const active = pathname.startsWith(n.path);
            return (
              <Link
                key={n.path}
                href={n.path}
                className={`px-3 py-1.5 rounded text-sm transition ${
                  active
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* ACTIONS */}
        <div className="flex items-center gap-4">
          {lowStockCount > 0 && (
            <Link
              href="/inventory/low-stock"
              className="text-sm text-red-600 font-medium"
            >
              ⚠ Low Stock ({lowStockCount})
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:underline"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
