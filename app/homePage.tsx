"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useState, useEffect } from "react";

export default function homePage() {
  const router = useRouter();
  const { authenticated, role, login, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);
 const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent page reload
    // Your submission logic here (e.g., validate or send to API)
    console.log('Submitted passkey:', passkey);
    // Example: If it's a valid passkey, do something like redirect or show success
    if (passkey === 'correctpasskey') {
      alert('Passkey accepted!');
    } else {
      alert('Invalid passkey');
    }
    setPasskey(''); // Clear input after submit
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <img src="globe.svg" alt="App Logo" className="w-32 h-32 animate-bounce" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-80">
       
        <h1 className="text-2xl font-bold mb-4 text-black">Enter Passkey</h1>
        <input
          type="password"
          value={passkey}
          onChange={(e) => setPasskey(e.target.value)}
          className="w-full max-w-md p-3 border rounded-xl shadow-md mb-4"
          placeholder="Enter your passkey"
        />
        <button
          onClick={async () => {
            const success = await login(passkey);
            if (!success) setError("Invalid passkey");
          }}
          className="w-full max-w-md py-3 bg-blue-500 text-white rounded-xl font-bold hover:opacity-90"
        >
          Login
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </form>
      </div>
    );
  }

  // ✅ After login → Show options
  const buttons = [
    { name: "Add Bill", link: "/add-bill", color: "bg-green-500" },
    { name: "View Bills", link: "/view-bills", color: "bg-blue-500" },
    { name: "Check Balance", link: "/check-balance", color: "bg-yellow-500" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4 text-black">Welcome ({role})</h1>
      {buttons.map((btn) => (
        <button
          key={btn.name}
          onClick={() => router.push(btn.link)}
          className={`w-full max-w-md py-4 text-white font-bold text-lg rounded-xl shadow-md ${btn.color} hover:opacity-90 transition`}
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
  