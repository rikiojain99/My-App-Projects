"use client";
import React from "react";

export default function Label({ text }: { text: string }) {
  return <span className="text-sm font-medium text-gray-600">{text}</span>;
}
