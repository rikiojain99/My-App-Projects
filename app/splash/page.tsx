"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/home"); // redirect to Home Page
    }, 3000); // 3 seconds

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-600">
      <img
        src="/logo.png" // make sure your logo is in public/logo.png
        alt="App Logo"
        className="w-32 h-32 animate-bounce"
      />
    </div>
  );
}
