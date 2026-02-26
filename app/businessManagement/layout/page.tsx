"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function Home() {
  const { authenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState("");

  const [totalBills, setTotalBills] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Only one section open
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

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-10">
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="underline text-2xl font-semibold text-center">
          Business Management
        </h1>

        <Section
          id="vendor"
          title="Vendor Management"
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          <DashboardLink href="/vendors/sale" icon="🏪" label="Vendor Sale" />
          <DashboardLink href="/vendors/ledger" icon="📋" label="Vendor Ledger" />
        </Section>

        <Section
          id="inventory"
          title="Inventory"
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          <DashboardLink href="/inventory/available-stock" icon="📦" label="Available Stock" />
          <DashboardLink href="/inventory/stock-holdings" icon="🗂️" label="Manage Stock Details" />
          <DashboardLink href="/inventory/view-inventory" icon="📑" label="View Inventory" />
        </Section>

        <Section
          id="reports"
          title="Reports"
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          <DashboardLink href="/profit-report" icon="📈" label="Profit Report" />
          <DashboardLink href="/reports/stockReport" icon="📊" label="Stock Report" />
          <DashboardLink href="/stock-report" icon="🧾" label="Stock Report (Legacy)" />
          <DashboardLink href="/expenses/add-expense" icon="💸" label="Add Expense" />
        </Section>

        <Section
          id="manufacturing"
          title="Manufacturing"
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          <DashboardLink
            href="/manufacturing/history"
            icon="🏭"
            label="Manufacturing History"
          />
        </Section>
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
          v
        </span>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 space-y-2">{children}</div>
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
      <span className="text-gray-400">&gt;</span>
    </Link>
  );
}
