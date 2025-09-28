"use client";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authenticated) {
      router.replace("/"); // redirect to home/login if not authenticated
    }
  }, [authenticated, router]);

  if (!authenticated) {
    return null; // optional: show spinner
  }

  return <>{children}</>;
}
