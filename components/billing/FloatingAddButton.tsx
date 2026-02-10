"use client";

import { useRouter } from "next/navigation";

export default function FloatingAddButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/bills/add-bill")}
      className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white text-3xl rounded-full shadow-lg flex items-center justify-center"
    >
      +
    </button>
  );
}
