"use client";

import { usePathname, useRouter } from "next/navigation";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { label: "Bills", icon: "🧾", path: "/bills" },
    { label: "Stock", icon: "📦", path: "/inventory" },
    { label: "Reports", icon: "📊", path: "/reports" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 z-50">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.path);

        return (
          <button
            key={tab.path}
            onClick={() => router.push(tab.path)}
            className={`flex flex-col items-center text-xs ${
              active ? "text-blue-600 font-semibold" : "text-gray-500"
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
