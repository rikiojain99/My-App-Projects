"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";

const HOME_ICON = String.fromCodePoint(0x1F3E0);
const ESTIMATE_ICON = String.fromCodePoint(0x1F9FE);
const STOCK_ICON = String.fromCodePoint(0x1F4E6);
const BUSINESS_ICON = String.fromCodePoint(0x1F3E2);

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { authenticated, logout, loading } = useAuth();
  const [lowStockCount, setLowStockCount] = useState(0);

  /* ================= LOW STOCK FETCH ================= */
  useEffect(() => {
    if (loading) return;
    if (!authenticated) return;

    const fetchLowStock = async () => {
      try {
        const res = await fetch("/api/reports/low-stock");
        if (!res.ok) return;

        const data = await res.json();
        setLowStockCount(Array.isArray(data) ? data.length : 0);
      } catch {
        setLowStockCount(0);
      }
    };

    fetchLowStock();

    const interval = setInterval(fetchLowStock, 60000);
    return () => clearInterval(interval);
  }, [authenticated, loading]);

  if (loading) return null;
  if (!authenticated) return null;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    logout();
    router.replace("/");
  };

  const topNav = [
    { label: "Dashboard", path: "/" },
    { label: "Estimates", path: "/bills/view-bills" },
    { label: "Inventory", path: "/inventory/stock-view" },
    { label: "Business", path: "/businessManagement/layout" },
  ];

  const bottomNav = [
    { label: "Home", path: "/", icon: HOME_ICON },
    { label: "Estimates", path: "/bills/view-bills", icon: ESTIMATE_ICON },
    {
      label: "Stock",
      path: "/inventory/stock-view",
      icon: STOCK_ICON,
      alert: lowStockCount > 0,
    },
    { label: "Business", path: "/businessManagement/layout", icon: BUSINESS_ICON },
  ];

  const isActivePath = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <>
      <header className="hidden md:flex sticky top-0 z-50 bg-white border-b h-16 items-center shadow-sm">
        <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/Sj.png" alt="Logo" className="h-9 w-9" />
            <span className="font-bold text-lg tracking-tight">SJ Light House</span>
          </Link>

          <nav className="flex gap-1">
            {topNav.map((n) => {
              const active = isActivePath(n.path);
              return (
                <Link
                  key={n.path}
                  href={n.path}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="md:hidden sticky top-0 z-40 bg-white border-b px-4 h-14 flex items-center justify-between shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <img src="/Sj.png" alt="Logo" className="h-8 w-8" />
          <span className="font-bold text-gray-800">SJ Light House</span>
        </Link>

        <button
          onClick={handleLogout}
          className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full"
        >
          Logout
        </button>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          {bottomNav.map((n) => {
            const active = isActivePath(n.path);
            return (
              <Link
                key={n.path}
                href={n.path}
                className={`flex flex-col items-center justify-center w-full h-full relative group transition-colors ${
                  active ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <div className="text-xl mb-1 relative">
                  {n.icon}

                  {n.alert && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  )}
                </div>

                <span className="text-[10px] font-medium">{n.label}</span>

                {active && <div className="absolute bottom-0 w-1 h-1 bg-blue-600 rounded-t-full" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}