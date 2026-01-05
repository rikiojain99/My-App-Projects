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

        // ✅ redirect back to last page
        const redirect =
          sessionStorage.getItem("redirectAfterLogin") || "/";
        sessionStorage.removeItem("redirectAfterLogin");
        router.replace(redirect);
      } else {
        setError("Invalid passkey");
        setPasskey("");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  useEffect(() => {
    if (!authenticated && !loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [authenticated, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <img src="globe.svg" alt="App Logo" className="w-32 h-32 animate-bounce" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen min-w-fit flex-col justify-center bg-gray-50 px-6 py-12 lg:px-8">
        <div className="flex flex-col items-center justify-center m-24 bg-gray-100 p-16 rounded-2xl">
          <h1 className="text-2xl font-bold mb-4 text-black">
            Enter Passkey
          </h1>
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
  }

  const buttons = [
    { name: "Add Bill", link: "/add-bill", color: "bg-green-500" },
    { name: "View Bills", link: "/view-bills", color: "bg-blue-500" },
    { name: "Inventry", link: "/view-inventry", color: "bg-blue-500" },
    { name: "Check Balance", link: "/check-balance", color: "bg-yellow-500" },
    { name: "Testing pages", link: "/testingFolder", color: "bg-yellow-500" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4 text-black">
        Welcome ({role})
      </h1>

      {buttons.map((btn) => (
        <button
          key={btn.name}
          onClick={() => router.push(btn.link)}
          className={`w-full max-w-md py-4 text-white font-bold gap-3 border-2 text-lg rounded-xl shadow-md ${btn.color} hover:opacity-90 transition`}
        >
          {btn.name}
        </button>
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
