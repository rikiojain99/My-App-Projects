"use client";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  forwardRef,
} from "react";

/* ================= TYPES ================= */
type Item = {
  name: string;
  qty: number;
  rate: number;
  code?: string;
  total: number;
};

type ItemType = {
  _id: string;
  name: string;
  code?: string;
};

type Props = {
  index: number;
  items: Item[];
  handleItemChange: (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
};

/* ================= COMPONENT ================= */
const ItemNameInput = forwardRef<HTMLInputElement, Props>(
  ({ index, items, handleItemChange }, ref) => {
    const currentItemName = items[index]?.name ?? "";
    const [query, setQuery] =
      useState<string>(currentItemName);
    const [suggestions, setSuggestions] =
      useState<ItemType[]>([]);
    const [stockQty, setStockQty] =
      useState<number | null>(null);
    const [selectedCode, setSelectedCode] =
      useState<string>("");
    const [isFocused, setIsFocused] =
      useState<boolean>(false);

    const suggestionTimer =
      useRef<NodeJS.Timeout | null>(null);
    const stockTimer =
      useRef<NodeJS.Timeout | null>(null);
    const blurTimer =
      useRef<NodeJS.Timeout | null>(null);

    const resolvedCode = useMemo(() => {
      if (selectedCode) return selectedCode;

      const normalized = query.trim().toLowerCase();
      if (!normalized) return "";

      const matched = suggestions.find((item) => {
        const nameMatch =
          item.name.trim().toLowerCase() === normalized;
        const codeMatch =
          item.code?.trim().toLowerCase() === normalized;
        return nameMatch || codeMatch;
      });

      return matched?.code ?? "";
    }, [query, selectedCode, suggestions]);

    useEffect(() => {
      setQuery(currentItemName);
    }, [currentItemName]);

    /* ---------- ITEM SUGGESTIONS ---------- */
    useEffect(() => {
      const trimmedQuery = query.trim();
      if (trimmedQuery.length < 3) {
        setSuggestions([]);
        return;
      }

      if (suggestionTimer.current) {
        clearTimeout(suggestionTimer.current);
      }

      suggestionTimer.current = setTimeout(
        async () => {
          try {
            const res = await fetch(
              `/api/items?search=${encodeURIComponent(
                trimmedQuery
              )}`
            );
            if (res.ok) {
              const data: ItemType[] =
                await res.json();
              setSuggestions(
                Array.isArray(data) ? data : []
              );
            }
          } catch {
            setSuggestions([]);
          }
        },
        300
      );

      return () => {
        if (suggestionTimer.current) {
          clearTimeout(suggestionTimer.current);
        }
      };
    }, [query]);

    /* ---------- STOCK CHECK ---------- */
    useEffect(() => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        setStockQty(null);
        return;
      }

      if (stockTimer.current) {
        clearTimeout(stockTimer.current);
      }

      stockTimer.current = setTimeout(
        async () => {
          try {
            const res = await fetch(
              `/api/stock/check?name=${encodeURIComponent(
                trimmedQuery
              )}`
            );
            if (res.ok) {
              const data = await res.json();
              setStockQty(
                typeof data?.availableQty === "number"
                  ? data.availableQty
                  : 0
              );
            }
          } catch {
            setStockQty(null);
          }
        },
        300
      );

      return () => {
        if (stockTimer.current) {
          clearTimeout(stockTimer.current);
        }
        if (blurTimer.current) {
          clearTimeout(blurTimer.current);
        }
      };
    }, [query]);

    /* ---------- UI ---------- */
    return (
      <div className="relative">
        <input
          ref={ref}
          name="name"
          value={query}
          placeholder="Item name"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          onChange={(
            e: React.ChangeEvent<HTMLInputElement>
          ) => {
            setQuery(e.target.value);
            setSelectedCode("");
            handleItemChange(index, e);
          }}
          onFocus={() => {
            setIsFocused(true);
            if (blurTimer.current) {
              clearTimeout(blurTimer.current);
            }
          }}
          onBlur={() => {
            blurTimer.current = setTimeout(() => {
              setIsFocused(false);
              setSuggestions([]);
            }, 120);
          }}
        />

        {/* SUGGESTIONS */}
        {isFocused && suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-20 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {suggestions.map((item) => (
              <li
                key={item._id}
                className="cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-blue-50"
                onMouseDown={(
                  e: React.MouseEvent<HTMLLIElement>
                ) => {
                  e.preventDefault();
                  setQuery(item.name);
                  setSelectedCode(item.code ?? "");

                  handleItemChange(index, {
                    target: {
                      name: "name",
                      value: item.name,
                    },
                  } as React.ChangeEvent<HTMLInputElement>);

                  setSuggestions([]);
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    {item.name}
                  </span>
                  {item.code && (
                    <span className="shrink-0 rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-500">
                      {item.code}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* STOCK STATUS */}
        {stockQty !== null && (
          <p className="mt-1 text-xs">
            {stockQty > 0 ? (
              <span className="text-green-700">
                In stock: {stockQty}
                {resolvedCode && (
                  <span className="ml-2 text-gray-500">
                    ({resolvedCode})
                  </span>
                )}
              </span>
            ) : (
              <span className="text-orange-600">
                Warning: Sold without stock
              </span>
            )}
          </p>
        )}
      </div>
    );
  }
);

ItemNameInput.displayName = "ItemNameInput";

export default ItemNameInput;
