"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

type AuthContextType = {
  authenticated: boolean;
  role: "admin" | "employee" | null;
  loading: boolean;
  login: (passkey: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  authenticated: false,
  role: null,
  loading: true,
  login: async () => false,
  logout: () => {},
});

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authenticated, setAuthenticated] = useState(false);
  const [role, setRole] = useState<"admin" | "employee" | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔐 Restore auth from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem("auth");

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAuthenticated(true);
        setRole(parsed.role);
      } catch {
        sessionStorage.removeItem("auth");
      }
    }

    setLoading(false);
  }, []);
useEffect(() => {
  const interval = setInterval(async () => {
    const res = await fetch("/api/auth/verify-session");
    if (res.status === 401) {
      logout();
      window.location.href = "/";
    }
  }, 60000);

  return () => clearInterval(interval);
}, []);

  const login = async (passkey: string) => {
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passkey }),
    });

    const data = await res.json();

    if (res.ok && data.ok) {
      setAuthenticated(true);
      setRole(data.role);
      sessionStorage.setItem(
        "auth",
        JSON.stringify({ role: data.role })
      );
      return true;
    }

    return false;
  };

  const logout = () => {
    setAuthenticated(false);
    setRole(null);
    sessionStorage.removeItem("auth");
  };

  return (
    <AuthContext.Provider
      value={{ authenticated, role, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
