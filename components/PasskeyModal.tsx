// components/PasskeyModal.tsx
"use client";
import React, { useState } from "react";

export default function PasskeyModal({ onSuccess }: { onSuccess: (role: "admin" | "employee") => void }) {
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!passkey) {
      setError("Enter passkey");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error || "Invalid passkey");
        setLoading(false);
        return;
      }
      onSuccess(data.role);
    } catch (err) {
      setError("Server error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // optional: allow Enter key
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold mb-2">Passkey Required</h2>
        <p className="text-sm text-gray-600 mb-4">Enter your passkey to continue.</p>

        <input
          type="password"
          value={passkey}
          onChange={(e) => setPasskey(e.target.value)}
          onKeyDown={onKey}
          className="w-full text-black p-2 border rounded mb-3"
          placeholder="Enter passkey"
          autoFocus
        />
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button
            onClick={() => {
              // try a destructive fallback — close window if no auth (best-effort)
              try {
                window.close();
              } catch {
                // no-op
              }
            }}
            className="px-3 py-2 rounded bg-gray-300"
            title="Close"
          >
            Close
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="px-3 py-2 rounded bg-blue-600 text-white"
          >
            {loading ? "Checking..." : "Enter"}
          </button>
        </div>
      </div>
    </div>
  );
}
