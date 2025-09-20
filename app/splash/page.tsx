"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/home"); // Go to Home after 3s
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-600">
      <img
        src="/logo.png" // put logo.png inside public/
        alt="App Logo"
        className="w-32 h-32 animate-bounce"
      />
    </div>
  );
}
