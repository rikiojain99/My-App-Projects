"use client";
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && <label className="block mb-1 text-sm font-medium text-gray-700">{label}</label>}
      <input
        {...props}
        className="w-full p-2 border rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>
  );
}
