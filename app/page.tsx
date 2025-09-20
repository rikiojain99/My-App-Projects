"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Globe from "../public/globe.svg";
export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true); // splash state

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false); // hide splash after 3s
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    // Splash screen
    return (
      <div className="flex items-center justify-center min-h-screen ">
        <img
          src="globe.svg"
          alt="App Logo"
          className="w-32 h-32 animate-bounce"
        />
      </div>
    );
  }

  // Main Home page after splash
  const buttons = [
    { name: "Add Bill", link: "/add-bill", color: "bg-green-500" },
    { name: "View Bills", link: "/view-bills", color: "bg-blue-500" },
    { name: "Check Balance", link: "/check-balance", color: "bg-yellow-500" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4 text-black">Welcome</h1>
      {buttons.map((btn) => (
        <button
          key={btn.name}
          onClick={() => router.push(btn.link)}
          className={`w-full max-w-md py-4 text-white font-bold text-lg rounded-xl shadow-md ${btn.color} hover:opacity-90 transition`}
        >
          {btn.name}
        </button>
      ))}
    </div>
  );
}
