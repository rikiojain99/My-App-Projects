"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LowStockBanner from "@/components/LowStockBanner";

export default function Home() {
  const { authenticated, role, login, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState("");

  const [totalBills, setTotalBills] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

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

  /* ---------------- LOADING SCREEN ---------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <img src="/globe.svg" className="w-24 h-24 animate-bounce" />
      </div>
    );
  }

  /* ---------------- LOGIN SCREEN ---------------- */
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-xl border">
          <h1 className="text-xl font-semibold text-center mb-4">
            Enter Passkey
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              ref={inputRef}
              type="password"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              className="w-full p-3 border rounded"
              placeholder="Passkey"
              required
            />
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white rounded"
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
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-xl font-semibold text-center">
          Welcome ({role})
        </h1>

        {/* SUMMARY */}
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard icon="🧾" label="Bills" value={totalBills} />
          <SummaryCard icon="⚠️" label="Low Stock" value={lowStockCount} />
        </div>

        <LowStockBanner />

        {/* BILLS */}
        <Section title="Bills">
          <DashboardLink href="/bills/add-bill" icon="🧾" label="Add Bill" />
          <DashboardLink href="/bills/view-bills" icon="📂" label="View Bills" />
        </Section>

        {/* INVENTORY */}
        <Section title="Inventory">
          <DashboardLink
            href="/inventory/add-stoock"
            icon="➕📦"
            label="Add Stock"
          />
          <DashboardLink
            href="/inventory/stockView"
            icon="📦"
            label="View Stock"
          />
          <DashboardLink
            href="/inventory/stock-holdings"
            icon="📊"
            label="Stock Holdings"
          />
          <DashboardLink
            href="/inventory/opening-stock"
            icon="🗂️"
            label="Opening Stock (One-time)"
          />
        </Section>

        {/* LOGOUT */}
        <button
          onClick={logout}
          className="w-full py-2 border rounded text-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

/* =================================================
   SMALL COMPONENTS
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
    <div className="bg-white border rounded p-4 text-center">
      <div className="text-lg">{icon}</div>
      <div className="font-semibold">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border rounded p-4 space-y-2">
      <h2 className="font-semibold mb-2">{title}</h2>
      {children}
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
      className="w-full flex items-center justify-between px-4 py-3 border rounded hover:bg-gray-50 transition"
    >
      <span className="flex items-center gap-2">
        <span>{icon}</span>
        {label}
      </span>
      <span className="text-gray-400">›</span>
    </Link>
  );
}
 