"use client";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export default function Button({ children, variant = "primary", ...props }: ButtonProps) {
  const baseStyle =
    "w-full py-2 px-4 rounded-lg font-bold text-white shadow-md transition";
  const variants = {
    primary: "bg-blue-500 hover:bg-blue-600",
    secondary: "bg-gray-500 hover:bg-gray-600",
    danger: "bg-red-500 hover:bg-red-600",
  };

  return (
    <button {...props} className={`${baseStyle} ${variants[variant]}`}>
      {children}
    </button>
  );
}
