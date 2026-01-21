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

  const [totalBills, setTotalBills] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);

  /* ---------------- LOADING ---------------- */
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  /* ---------------- FETCH COUNTS ---------------- */
  useEffect(() => {
    if (!authenticated) return;

    // Total bills
    fetch("/api/bills?page=1&limit=1")
      .then((r) => r.json())
      .then((d) => setTotalBills(d.totalBills || 0))
      .catch(() => {});

    // Low stock count
    fetch("/api/reports/low-stock")
      .then((r) => r.json())
      .then((d) => setLowStockCount(d.length || 0))
      .catch(() => {});
  }, [authenticated]);

  /* ---------------- KEYBOARD SHORTCUTS ---------------- */
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
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      const success = await login(passkey);
      if (success) {
        setPasskey("");
        const redirect =
          sessionStorage.getItem("redirectAfterLogin") || "/";
        sessionStorage.removeItem("redirectAfterLogin");
        router.replace(redirect);
      } else {
        setError("Invalid passkey");
      }
    } catch {
      setError("Something went wrong. Try again.");
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
        <img
          src="globe.svg"
          alt="App Logo"
          className="w-28 h-28 animate-bounce"
        />
      </div>
    );
  }

  /* ---------------- LOGIN SCREEN ---------------- */
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
          <h1 className="text-2xl font-bold mb-6 text-center text-black">
            Enter Passkey
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              ref={inputRef}
              type="password"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              className="w-full p-3 border rounded-xl text-black"
              placeholder="Enter your passkey"
              required
            />

            <button
              type="submit"
              className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold hover:opacity-90"
            >
              Login
            </button>
          </form>

          {error && (
            <p className="text-red-500 text-center mt-4">{error}</p>
          )}
        </div>
      </div>
    );
  }

  /* ---------------- MODULES ---------------- */
  const modules = [
    {
      title: "Bills",
      items: [
        {
          name: "Add Bill",
          icon: "🧾",
          shortcut: "Alt + B",
          link: "/bills/add-bill",
          color: "bg-green-500",
        },
        {
          name: "View Bills",
          icon: "📂",
          link: "/bills/view-bills",
          color: "bg-blue-500",
        },
      ],
    },
    {
      title: "Inventory",
      items: [
        {
          name: "Add Stock",
          icon: "➕📦",
          shortcut: "Alt + S",
          link: "/inventory/add-stoock",
          color: "bg-green-500",
        },
        {
  name: "Stock Holdings",
  icon: "📊",
  link: "/inventory/stock-holdings",
  color: "bg-purple-500",
},
        {
          name: "View Stock",
          icon: "📦",
          link: "/inventory/stockView",
          color: "bg-blue-500",
        },
        {
  name: "Low Stock Items",
  icon: "⚠️",
  link: "/inventory/low-stock",
  color: "bg-red-500",
}

      ],
    },
  ];

  /* ---------------- DASHBOARD ---------------- */
  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      <div className="w-full max-w-lg space-y-6">
        <h1 className="text-2xl font-bold text-center text-black">
          Welcome ({role})
        </h1>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-2xl">🧾</div>
            <div className="text-lg font-bold text-black">{totalBills}</div>
            <div className="text-sm text-gray-500">Total Bills</div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-2xl">⚠️</div>
            <div className="text-lg font-bold text-black">
              {lowStockCount}
            </div>
            <div className="text-sm text-gray-500">Low Stock Items</div>
          </div>
        </div>

        {/* LOW STOCK ALERT */}
        <LowStockBanner />

        {/* MODULE CARDS */}
        {modules.map((mod) => (
          <div
            key={mod.title}
            className="bg-white rounded-xl shadow-md p-4"
          >
            <h2 className="text-lg font-bold text-black mb-3">
              {mod.title}
            </h2>

            <div className="space-y-3">
              {mod.items.map((btn) => (
                <button
                  key={btn.name}
                  onClick={() => router.push(btn.link)}
                  className={`w-full py-3 px-4 text-white font-bold rounded-xl shadow ${btn.color} hover:opacity-90 flex items-center justify-between`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-xl">{btn.icon}</span>
                    {btn.name}
                  </span>

                  {btn.shortcut && (
                    <span className="text-xs bg-black/20 px-2 py-1 rounded">
                      {btn.shortcut}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* LOGOUT */}
        <button
          onClick={logout}
          className="w-full py-3 bg-red-500 text-white rounded-xl font-bold"
        >
          Logout...
        </button>
      </div>
    </div>
  );
}
