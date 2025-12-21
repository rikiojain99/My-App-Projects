"use client";
import { useAuth } from "@/components/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authenticated) {
      // ✅ save where user was
      sessionStorage.setItem("redirectAfterLogin", pathname);
      router.replace("/");
    }
  }, [authenticated, pathname, router]);

  if (!authenticated) return null;

  return <>{children}</>;
}
