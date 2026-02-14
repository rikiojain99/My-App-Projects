"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  inputRef: (
    el: HTMLInputElement | null
  ) => void;
  onEnter: () => void;
};

export default function ItemNameInput({
  value,
  onChange,
  inputRef,
  onEnter,
}: Props) {
  const [suggestions, setSuggestions] =
    useState<string[]>([]);
  const debounceRef =
    useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current)
      clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(
      async () => {
        const res = await fetch(
          `/api/items?search=${value}`
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(
            data.map((i: any) => i.name)
          );
        }
      },
      300
    );

    return () => {
      if (debounceRef.current)
        clearTimeout(debounceRef.current);
    };
  }, [value]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        name="name"
        value={value}
        onChange={onChange}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnter();
          }
        }}
        placeholder="Item Name"
        className="p-2 border rounded w-full"
        autoComplete="off"
        required
      />

      {suggestions.length > 0 && (
        <div className="absolute z-50 bg-white border rounded w-full max-h-32 overflow-y-auto shadow-lg">
          {suggestions.map((s) => (
            <div
              key={s}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange({
                  target: {
                    name: "name",
                    value: s,
                  },
                } as any);
                setSuggestions([]);
              }}
              className="px-2 py-1 cursor-pointer hover:bg-blue-100"
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
