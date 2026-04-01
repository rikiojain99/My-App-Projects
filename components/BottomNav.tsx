"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const HOME_ICON = String.fromCodePoint(0x1F3E0);
const ESTIMATE_ICON = String.fromCodePoint(0x1F9FE);
const STOCK_ICON = String.fromCodePoint(0x1F4E6);
const BUSINESS_ICON = String.fromCodePoint(0x1F3E2);

export default function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { label: "Home", icon: HOME_ICON, path: "/" },
    { label: "Estimates", icon: ESTIMATE_ICON, path: "/bills/view-bills" },
    { label: "Stock", icon: STOCK_ICON, path: "/inventory/stock-view" },
    { label: "Business", icon: BUSINESS_ICON, path: "/businessManagement/layout" },
  ];

  const isActivePath = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 z-50 md:hidden">
      {tabs.map((tab) => {
        const active = isActivePath(tab.path);

        return (
          <Link
            key={tab.path}
            href={tab.path}
            className={`flex flex-col items-center text-xs ${
              active ? "text-blue-600 font-semibold" : "text-gray-500"
            }`}
          >
            <span className="text-sm">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}