"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const router = useRouter();
  const { authenticated, role, login, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const success = await login(passkey);
      if (success) {
        setPasskey("");
        setError("");
        const redirect = sessionStorage.getItem("redirectAfterLogin") || "/";
        sessionStorage.removeItem("redirectAfterLogin");
        router.replace(redirect);
      } else setError("Invalid passkey");
    } catch {
      setError("An error occurred. Please try again.");
    }
  };

  useEffect(() => {
    if (!authenticated && !loading && inputRef.current) inputRef.current.focus();
  }, [authenticated, loading]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <img src="globe.svg" alt="App Logo" className="w-32 h-32 animate-bounce" />
      </div>
    );

  if (!authenticated)
    return (
      <div className="flex min-h-screen flex-col justify-center bg-gray-50 px-6 py-12">
        <div className="flex flex-col items-center m-24 bg-gray-100 p-16 rounded-2xl">
          <h1 className="text-2xl font-bold mb-4 text-black">Enter Passkey</h1>
          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="password"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              className="w-full max-w-md p-3 m-1 border rounded-xl text-black shadow-md mb-4"
              placeholder="Enter your passkey"
              required
            />
            <button
              type="submit"
              className="w-full max-w-md py-3 bg-blue-500 text-white rounded-xl font-bold hover:opacity-90"
            >
              Login
            </button>
          </form>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      </div>
    );

  // ✅ Modules definition
  const modules = [
    {
      title: "Bills",
      items: [
        { name: "Add Bill", link: "/bills/add-bill", color: "bg-green-500" },
        { name: "View Bills", link: "/bills/view-bills", color: "bg-blue-500" },
        { name: "Check Balance", link: "/bills/check-balance", color: "bg-yellow-500" },
      ],
    },
    {
      title: "Inventory",
      items: [
        { name: "View Inventory", link: "/inventory/view-inventry", color: "bg-blue-500" },
        { name: "Add Inventory", link: "/inventory/add-inventry", color: "bg-green-500" },
        
        { name: "View Stock", link: "/inventory/stockView", color: "bg-blue-500" },
        { name: "Add Stock", link: "/inventory/add-stoock", color: "bg-green-500" },
      ],
    },
    {
      title: "Other",
      items: [{ name: "Testing pages", link: "/testingFolder", color: "bg-yellow-500" }],
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-4 text-black">Welcome ({role})</h1>

      {modules.map((mod) => (
        <div key={mod.title} className="w-full max-w-md p-4 bg-white rounded-xl shadow-md space-y-2">
          <h2 className="text-lg font-bold text-black mb-2">{mod.title}</h2>
          {mod.items.map((btn) => (
            <button
              key={btn.name}
              onClick={() => router.push(btn.link)}
              className={`w-full py-3 text-white font-bold text-lg rounded-xl shadow-md ${btn.color} hover:opacity-90`}
            >
              {btn.name}
            </button>
          ))}
        </div>
      ))}

      <button
        onClick={logout}
        className="w-full max-w-md py-3 bg-red-500 text-white rounded-xl font-bold mt-4"
      >
        Logout
      </button>
    </div>
  );
}
