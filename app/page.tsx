"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useState, useEffect, useRef } from "react";
import LowStockBanner from "@/components/LowStockBanner";

export default function Home() {
  const router = useRouter();
  const { authenticated, role, login, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState("");

  const [totalBills, setTotalBills] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  /* ---------------- LOADING ---------------- */
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  /* ---------------- FETCH COUNTS ---------------- */
  useEffect(() => {
    if (!authenticated) return;

    fetch("/api/bills?page=1&limit=1")
      .then((r) => r.json())
      .then((d) => setTotalBills(d.totalBills || 0));

    fetch("/api/reports/low-stock")
      .then((r) => r.json())
      .then((d) => setLowStockCount(d.length || 0));
  }, [authenticated]);

  /* ---------------- SHORTCUTS ---------------- */
  useEffect(() => {
    if (!authenticated) return;

    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        router.push("/bills/add-bill");
      }
      if (e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        router.push("/inventory/add-stoock");
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [authenticated, router]);

  /* ---------------- LOGIN ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const success = await login(passkey);
    if (success) {
      setPasskey("");
      router.replace("/");
    } else {
      setError("Invalid passkey");
    }
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
        <img src="globe.svg" className="w-24 h-24 animate-bounce" />
      </div>
    );
  }

  /* ---------------- LOGIN SCREEN ---------------- */
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl border w-full max-w-md">
          <h1 className="text-xl font-semibold mb-4 text-center">
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
            <button className="w-full py-2 bg-blue-600 text-white rounded">
              Login
            </button>
          </form>

          {error && (
            <p className="text-red-500 text-sm mt-3 text-center">
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
          <div className="bg-white border rounded p-4 text-center">
            <div className="text-lg">🧾</div>
            <div className="font-semibold">{totalBills}</div>
            <div className="text-xs text-gray-500">Bills</div>
          </div>

          <div className="bg-white border rounded p-4 text-center">
            <div className="text-lg">⚠️</div>
            <div className="font-semibold">{lowStockCount}</div>
            <div className="text-xs text-gray-500">Low Stock</div>
          </div>
        </div>

        <LowStockBanner />

        {/* BILLS */}
        <div className="bg-white border rounded p-4">
          <h2 className="font-semibold mb-3">Bills</h2>

          <div className="space-y-2">
            <DashboardButton
              label="Add Bill"
              icon="🧾"
              shortcut="Alt+B"
              onClick={() => router.push("/bills/add-bill")}
            />
            <DashboardButton
              label="View Bills"
              icon="📂"
              onClick={() => router.push("/bills/view-bills")}
            />
          </div>
        </div>

        {/* INVENTORY */}
        <div className="bg-white border rounded p-4">
          <h2 className="font-semibold mb-3">Inventory</h2>

          <div className="space-y-2">
            <DashboardButton
              label="Add Stock"
              icon="➕📦"
              shortcut="Alt+S"
              onClick={() => router.push("/inventory/add-stoock")}
            />
            <DashboardButton
              label="View Stock"
              icon="📦"
              onClick={() => router.push("/inventory/stockView")}
            />
            <DashboardButton
              label="Stock Holdings"
              icon="📊"
              onClick={() => router.push("/inventory/stock-holdings")}
            />
            <DashboardButton
              label="Opening Stock (One-time)"
              icon="🗂️"
              onClick={() => router.push("/inventory/opening-stock")}
            />
          </div>
        </div>

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

/* ---------------- BUTTON COMPONENT ---------------- */
function DashboardButton({
  label,
  icon,
  shortcut,
  onClick,
}: {
  label: string;
  icon: string;
  shortcut?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex justify-between items-center px-4 py-3 border rounded hover:bg-gray-50"
    >
      <span className="flex items-center gap-2">
        <span>{icon}</span>
        {label}
      </span>

      {shortcut && (
        <span className="text-xs text-gray-500">{shortcut}</span>
      )}
    </button>
  );
}
