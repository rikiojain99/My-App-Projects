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
    const [query, setQuery] = useState<string>(currentItemName);
    const [suggestions, setSuggestions] = useState<ItemType[]>([]);
    const [stockQty, setStockQty] = useState<number | null>(null);
    const [selectedCode, setSelectedCode] = useState<string>("");
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] =
      useState<boolean>(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const suggestionTimer = useRef<NodeJS.Timeout | null>(null);
    const stockTimer = useRef<NodeJS.Timeout | null>(null);
    const blurTimer = useRef<NodeJS.Timeout | null>(null);
    const suggestionReqId = useRef(0);
    const stockReqId = useRef(0);

    const normalizedQuery = query.trim();
    const listboxId = `item-name-suggestions-${index}`;
    const shouldShowDropdown =
      isFocused && normalizedQuery.length >= 3;

    const resolvedCode = useMemo(() => {
      if (selectedCode) return selectedCode;

      const normalized = normalizedQuery.toLowerCase();
      if (!normalized) return "";

      const matched = suggestions.find((item) => {
        const nameMatch =
          item.name.trim().toLowerCase() === normalized;
        const codeMatch =
          item.code?.trim().toLowerCase() === normalized;
        return nameMatch || codeMatch;
      });

      return matched?.code ?? "";
    }, [normalizedQuery, selectedCode, suggestions]);

    useEffect(() => {
      setQuery(currentItemName);
    }, [currentItemName]);

    useEffect(() => {
      return () => {
        if (suggestionTimer.current) clearTimeout(suggestionTimer.current);
        if (stockTimer.current) clearTimeout(stockTimer.current);
        if (blurTimer.current) clearTimeout(blurTimer.current);
      };
    }, []);

    /* ---------- ITEM SUGGESTIONS ---------- */
    useEffect(() => {
      if (normalizedQuery.length < 3) {
        setSuggestions([]);
        setActiveIndex(-1);
        setIsLoadingSuggestions(false);
        return;
      }

      if (suggestionTimer.current) clearTimeout(suggestionTimer.current);

      setIsLoadingSuggestions(true);
      suggestionTimer.current = setTimeout(async () => {
        const reqId = ++suggestionReqId.current;

        try {
          const res = await fetch(
            `/api/items?search=${encodeURIComponent(
              normalizedQuery
            )}`
          );

          if (!res.ok) {
            if (reqId === suggestionReqId.current) {
              setSuggestions([]);
              setActiveIndex(-1);
            }
            return;
          }

          const data: ItemType[] = await res.json();
          if (reqId !== suggestionReqId.current) return;

          const nextSuggestions = Array.isArray(data)
            ? data
            : [];

          setSuggestions(nextSuggestions);
          setActiveIndex(
            nextSuggestions.length > 0 ? 0 : -1
          );
        } catch {
          if (reqId === suggestionReqId.current) {
            setSuggestions([]);
            setActiveIndex(-1);
          }
        } finally {
          if (reqId === suggestionReqId.current) {
            setIsLoadingSuggestions(false);
          }
        }
      }, 300);

      return () => {
        if (suggestionTimer.current)
          clearTimeout(suggestionTimer.current);
      };
    }, [normalizedQuery]);

    /* ---------- STOCK CHECK ---------- */
    useEffect(() => {
      if (!normalizedQuery) {
        setStockQty(null);
        return;
      }

      if (stockTimer.current) clearTimeout(stockTimer.current);

      stockTimer.current = setTimeout(async () => {
        const reqId = ++stockReqId.current;

        try {
          const res = await fetch(
            `/api/stock/check?name=${encodeURIComponent(
              normalizedQuery
            )}`
          );

          if (!res.ok) {
            if (reqId === stockReqId.current) {
              setStockQty(null);
            }
            return;
          }

          const data = await res.json();
          if (reqId !== stockReqId.current) return;

          setStockQty(
            typeof data?.availableQty === "number"
              ? data.availableQty
              : 0
          );
        } catch {
          if (reqId === stockReqId.current) {
            setStockQty(null);
          }
        }
      }, 300);

      return () => {
        if (stockTimer.current)
          clearTimeout(stockTimer.current);
      };
    }, [normalizedQuery]);

    const selectSuggestion = (item: ItemType) => {
      setQuery(item.name);
      setSelectedCode(item.code ?? "");
      setSuggestions([]);
      setActiveIndex(-1);

      handleItemChange(index, {
        target: {
          name: "name",
          value: item.name,
        },
      } as React.ChangeEvent<HTMLInputElement>);
    };

    const handleKeyDown = (
      e: React.KeyboardEvent<HTMLInputElement>
    ) => {
      const hasSuggestions = suggestions.length > 0;

      if (e.key === "ArrowDown" && hasSuggestions) {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }

      if (e.key === "ArrowUp" && hasSuggestions) {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        return;
      }

      if (e.key === "Enter" && hasSuggestions) {
        if (activeIndex >= 0) {
          e.preventDefault();
          selectSuggestion(suggestions[activeIndex]);
        }
        return;
      }

      if (e.key === "Escape") {
        setSuggestions([]);
        setActiveIndex(-1);
        setIsFocused(false);
      }
    };

    /* ================= UI ================= */
    return (
      <div className="relative">
        {/* INPUT (UNCHANGED) */}
        <input
          ref={ref}
          name="name"
          value={query}
          placeholder="Item name"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition duration-150 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          role="combobox"
          aria-expanded={shouldShowDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedCode("");
            setActiveIndex(-1);
            handleItemChange(index, e);
          }}
          onFocus={() => {
            setIsFocused(true);
            if (blurTimer.current)
              clearTimeout(blurTimer.current);
          }}
          onBlur={() => {
            blurTimer.current = setTimeout(() => {
              setIsFocused(false);
              setSuggestions([]);
              setActiveIndex(-1);
            }, 120);
          }}
          onKeyDown={handleKeyDown}
        />

        {/* SUGGESTIONS (MOBILE IMPROVED) */}
{/* SUGGESTIONS */}
{shouldShowDropdown && (
  <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 
                  bg-white shadow-2xl border border-slate-200
                  rounded-xl sm:rounded-xl
                  max-h-[70vh] sm:max-h-56 overflow-hidden">

    {isLoadingSuggestions ? (
      <p className="px-4 py-4 text-base sm:text-xs text-slate-500">
        Searching items...
      </p>
    ) : suggestions.length > 0 ? (
      <ul
        id={listboxId}
        role="listbox"
        className="overflow-y-auto"
      >
        {suggestions.map((item, suggestionIndex) => (
          <li
            key={item._id}
            role="option"
            aria-selected={activeIndex === suggestionIndex}
            className={`cursor-pointer
              px-5 py-4 text-lg sm:text-sm sm:px-3 sm:py-2
              transition
              ${activeIndex === suggestionIndex
                ? "bg-sky-100 text-sky-900"
                : "text-slate-800 hover:bg-slate-50"
              }`}
            onMouseEnter={() =>
              setActiveIndex(suggestionIndex)
            }
            onMouseDown={(e) => {
              e.preventDefault();
              selectSuggestion(item);
            }}
          >
            <div className="flex items-center justify-between gap-4 ">
              <span
  className="
    block
    overflow-x-auto
    whitespace-nowrap
    sm:truncate sm:overflow-hidden
    scrollbar-hide
  "
>
  {item.name}
</span>

              {item.code && (
                <span className="shrink-0 rounded-lg border 
                                 border-slate-300 bg-slate-100
                                 px-3 py-1 text-sm sm:text-xs">
                  {item.code}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <p className="px-4 py-4 text-base sm:text-xs text-slate-500">
        No matching items found.
      </p>
    )}
  </div>
)}
        {/* STOCK STATUS */}
        {stockQty !== null && (
          <p className="mt-1 text-xs">
            {stockQty > 0 ? (
              <span className="text-emerald-700">
                stock: {stockQty}
                {resolvedCode && (
                  <span className="ml-2 text-slate-500">
                    ({resolvedCode})
                  </span>
                )}
              </span>
            ) : (
              <span className="text-amber-700">
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