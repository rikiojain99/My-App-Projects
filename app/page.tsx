"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LowStockBanner from "@/components/LowStockBanner";

export default function Home() {
  const { authenticated, role, login } = useAuth();

  const [loading, setLoading] = useState(true);
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState("");

  const [totalBills, setTotalBills] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // 🔥 Only one section open
  const [openSection, setOpenSection] = useState<string | null>(null);

  /* ---------------- LOADING ---------------- */
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  /* ---------------- FETCH COUNTS ---------------- */
  useEffect(() => {
    if (!authenticated) return;

    fetch("/api/bills?page=1&limit=1")
      .then((r) => r.json())
      .then((d) => setTotalBills(d.totalBills || 0))
      .catch(() => {});

    fetch("/api/reports/low-stock")
      .then((r) => r.json())
      .then((d) => setLowStockCount(d.length || 0))
      .catch(() => {});
  }, [authenticated]);

  /* ---------------- LOGIN ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const ok = await login(passkey);
    if (!ok) setError("Invalid passkey");
  };

  useEffect(() => {
    if (!authenticated && !loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [authenticated, loading]);

  if (loading) return null;

  /* ---------------- LOGIN SCREEN ---------------- */
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-xl border shadow-sm">
          <h1 className="text-xl font-semibold text-center mb-4">
            Enter Passkey
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              ref={inputRef}
              type="password"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              className="w-full p-3 border rounded-lg"
              placeholder="Passkey"
              required
            />
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white rounded-lg"
            >
              Login
            </button>
          </form>

          {error && (
            <p className="text-red-500 text-sm text-center mt-3">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ---------------- DASHBOARD ---------------- */
  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-10">
      <div className="max-w-lg mx-auto space-y-6">

        <h1 className="text-2xl font-semibold text-center">
          Welcome ({role})
        </h1>

        {/* SUMMARY */}
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard icon="🧾" label="Bills" value={totalBills} />
          <SummaryCard icon="⚠️" label="Low Stock" value={lowStockCount} />
        </div>

        <LowStockBanner />

        {/* BILLS */}
        <Section
          id="bills"
          title="Bills"
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          <DashboardLink href="/bills/fast-bill" icon="🧾" label="Fast-Bill" />
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
          <DashboardLink href="/inventory/add-stoock" icon="➕📦" label="Add Stock" />
          <DashboardLink href="/inventory/stockView" icon="📦" label="View Stock" />
          <DashboardLink href="/inventory/stock-holdings" icon="📊" label="Available Stock " />
          <DashboardLink href="/inventory/opening-stock" icon="🗂️" label="Opening Stock (One-time)" />
        </Section>

        {/* MANUFACTURING */}
        <Section
          id="manufacturing"
          title="Manufacturing"
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          <DashboardLink href="/manufacturing/create" icon="🏭" label="Create Items" />
          <DashboardLink href="/manufacturing/history" icon="📂" label="View Manufacturing Items" />
        </Section>
{/* 
        {/* REPORTS 
        <Section
          id="reports"
          title="Reports"
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          <DashboardLink href="\reports\stockReport"  icon="📊" label="stock Report" />
          {/* <DashboardLink href="\inventory\view-inventry"  icon="📊" label="view-inventry" /> 
          {/* <DashboardLink href="/stock-report" icon="📊" label="stock-report" /> 
          <DashboardLink href="/profit-report" icon="📊" label="Profit Report" />
          <DashboardLink href="/manufacturing/history" icon="📂" label="Manufacturing History" />
        </Section>
         */}

      </div>
    </div>
  );
}

/* =================================================
   COMPONENTS
================================================= */

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white border rounded-xl p-4 text-center shadow-sm">
      <div className="text-lg">{icon}</div>
      <div className="font-semibold text-lg">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

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
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      {/* HEADER */}
      <button
        onClick={toggle}
        className="w-full flex justify-between items-center px-4 py-3 font-semibold"
      >
        <span>{title}</span>
        <span
          className={`transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
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
          <div className="px-4 pb-4 space-y-2">
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
      className="w-full flex items-center justify-between px-4 py-3 border rounded-lg hover:bg-gray-50 transition"
    >
      <span className="flex items-center gap-2">
        <span>{icon}</span>
        {label}
      </span>
      <span className="text-gray-400">›</span>
    </Link>
  );
}
