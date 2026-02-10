"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !authenticated) {
      sessionStorage.setItem(
        "redirectAfterLogin",
        pathname
      );
      router.replace("/");
    }
  }, [loading, authenticated, pathname, router]);

  if (loading) return null;
  if (!authenticated) return null;

  return <>{children}</>;
}
