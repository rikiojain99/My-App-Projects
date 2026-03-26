"use client";

import { useAuth } from "@/components/AuthProvider";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type SummaryState = {
  totalBills: number;
  lowStockCount: number;
  isLoading: boolean;
};

export default function Home() {
  const { authenticated, role, login } = useAuth();

  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<SummaryState>({
    totalBills: 0,
    lowStockCount: 0,
    isLoading: true,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // 🔥 Only one section open
  const [openSection, setOpenSection] = useState<string | null>(null);

  /* ---------------- FETCH COUNTS ---------------- */
  useEffect(() => {
    if (!authenticated) return;

    const controller = new AbortController();

    setSummary((prev) => ({ ...prev, isLoading: true }));

    const fetchSummary = async () => {
      try {
        const [billsRes, lowStockRes] = await Promise.all([
          fetch("/api/bills?page=1&limit=1", {
            signal: controller.signal,
          }),
          fetch("/api/reports/low-stock", {
            signal: controller.signal,
          }),
        ]);

        const [billsData, lowStockData] = await Promise.all([
          billsRes.ok ? billsRes.json() : null,
          lowStockRes.ok ? lowStockRes.json() : null,
        ]);

        setSummary({
          totalBills: Number(billsData?.totalBills || 0),
          lowStockCount: Array.isArray(lowStockData)
            ? lowStockData.length
            : 0,
          isLoading: false,
        });
      } catch (error: any) {
        if (error?.name === "AbortError") return;

        setSummary({
          totalBills: 0,
          lowStockCount: 0,
          isLoading: false,
        });
      }
    };

    fetchSummary();

    return () => controller.abort();
  }, [authenticated]);

  const summaryCards = useMemo(
    () => [
      {
        icon: "ðŸ§¾",
        label: "Total Bills",
        value: summary.totalBills,
        isLoading: summary.isLoading,
        bg: "bg-white",
        textColor: "text-gray-900",
      },
      {
        icon: "âš ï¸",
        label: "Low Stock",
        value: summary.lowStockCount,
        isLoading: summary.isLoading,
        bg:
          !summary.isLoading && summary.lowStockCount > 0
            ? "bg-red-50 border-red-200"
            : "bg-white",
        textColor:
          !summary.isLoading && summary.lowStockCount > 0
            ? "text-red-600"
            : "text-gray-900",
      },
    ],
    [summary]
  );

  const totalBills = summaryCards[0]?.isLoading
    ? -1
    : summaryCards[0]?.value ?? 0;
  const lowStockCount = summaryCards[1]?.isLoading
    ? -1
    : summaryCards[1]?.value ?? 0;

  /* ---------------- LOGIN ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const ok = await login(passkey);
    if (!ok) setError("Invalid passkey");
  };

  useEffect(() => {
    if (!authenticated && inputRef.current) {
      inputRef.current.focus();
    }
  }, [authenticated]);

  /* ---------------- LOGIN SCREEN ---------------- */
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl border shadow-sm">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
            Enter Passkey
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              ref={inputRef}
              type="password"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-center text-lg tracking-widest"
              placeholder="••••"
              required
            />
            <button
              type="submit"
              className="w-full py-4 bg-blue-600 active:bg-blue-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all"
            >
              Login
            </button>
          </form>

          {error && (
            <p className="text-red-500 text-sm text-center mt-4 font-medium">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ---------------- DASHBOARD ---------------- */
  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-md mx-auto space-y-6">

        <h1 className="text-2xl font-bold text-center text-gray-800">
          Welcome, {role}
        </h1>

        {/* SUMMARY */}
        <div className="grid grid-cols-2 gap-4">
          <SummaryCard icon="🧾" label="Total Bills"
            href="bills/view-bills"
          
          value={totalBills} />
          <SummaryCard 
            icon="⚠️" 
            label="Low Stock" 
            value={lowStockCount} 
            bg={lowStockCount > 0 ? "bg-red-50 border-red-200" : "bg-white"}
            textColor={lowStockCount > 0 ? "text-red-600" : "text-gray-900"}
            href="/inventory/low-stock"
          />
        </div>


        {/* BILLS */}
        <Section
          id="bills"
          title="Bills"
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          <DashboardLink href="/bills/fast-bill" icon="⚡" label="Fast Bill" />
          <DashboardLink href="/bills/add-bill" icon="🧾" label="Add Bill" />
          <DashboardLink href="/bills/view-bills" icon="📂" label="View Bills" />
        </Section>
      
        {/* INVENTORY */}
        <Section
          id="inventory"
          title="Inventory"
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          {/* Clean route name */}
          <DashboardLink href="/inventory/add-stock" icon="➕" label="Add Stock" />
          <DashboardLink href="/inventory/stock-view" icon="📦" label="View Stock" />
          <DashboardLink href="/inventory/stock-holdings" icon="📊" label="Available Stock" />
          {/* <DashboardLink href="/inventory/opening-stock" icon="🗂️" label="Opening Stock" /> */}
        </Section>

        {/* MANUFACTURING */}
        <Section
          id="manufacturing"
          title="Manufacturing"
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          <DashboardLink href="/manufacturing/create" icon="🏭" label="Create Items" />
          <DashboardLink href="/manufacturing/history" icon="📂" label="View History" />
        </Section>

      </div>
    </div>
  );
}

/* =================================================
   COMPONENTS
================================================= */

const SummaryCard = memo(function SummaryCard({
  icon,
  label,
  value,
  href,
  bg = "bg-white",
  textColor = "text-gray-900",
}: {
  icon: string;
  label: string;
  value: number;
  href?: string;
  bg?: string;
  textColor?: string;
}) {
  const isLoading = value < 0;

  const cardContent = (
    <div
      className={`${bg} border rounded-2xl p-5 text-center shadow-sm flex min-h-\[112px\] flex-col justify-between transition-all ${
        href ? "cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]" : ""
      }`}
    >
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
        <span className="text-2xl">{icon}</span> {label}
      </div>
      <div className="mt-3">
        {isLoading ? (
          <div className="mx-auto h-8 w-16 animate-pulse rounded-lg bg-gray-200" />
        ) : (
          <span className={`text-2xl font-bold ${textColor}`}>{value}</span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
});

function Section({
  id,
  title,
  children,
  openSection,
  setOpenSection,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  openSection: string | null;
  setOpenSection: (id: string | null) => void;
}) {
  const isOpen = openSection === id;

  const toggle = () => {
    setOpenSection(isOpen ? null : id);
  };

  return (
    <div className="bg-white border rounded-2xl shadow-sm overflow-hidden transition-all">
      {/* HEADER */}
      <button
        onClick={toggle}
        className={`w-full flex justify-between items-center px-5 py-4 font-semibold text-gray-700 active:bg-gray-50 transition-colors ${isOpen ? 'bg-gray-50' : 'bg-white'}`}
      >
        <span>{title}</span>
        <span
          className={`transition-transform duration-300 text-gray-400 ${isOpen ? "rotate-180" : ""}`}
        >
          ▼
        </span>
      </button>

      {/* BODY */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-3 pb-4 space-y-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="w-full flex items-center justify-between px-4 py-4 my-1 rounded-xl text-gray-600 hover:bg-gray-50 active:scale-[0.98] active:bg-blue-50 active:text-blue-700 transition-all border border-transparent hover:border-gray-100"
    >
      <span className="flex items-center gap-3">
        <span className="text-lg w-6 text-center">{icon}</span>
        <span className="font-medium">{label}</span>
      </span>
      <span className="text-gray-300 text-xl">›</span>
    </Link>
  );
}

