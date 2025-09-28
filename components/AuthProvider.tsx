"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

type AuthContextType = {
  authenticated: boolean;
  role: "admin" | "employee" | null;
  login: (passkey: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  authenticated: false,
  role: null,
  login: async () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [role, setRole] = useState<"admin" | "employee" | null>(null);

  // persist login in sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem("auth");
    if (saved) {
      const parsed = JSON.parse(saved);
      setAuthenticated(true);
      setRole(parsed.role);
    }
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
      sessionStorage.setItem("auth", JSON.stringify({ role: data.role }));
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
    <AuthContext.Provider value={{ authenticated, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
