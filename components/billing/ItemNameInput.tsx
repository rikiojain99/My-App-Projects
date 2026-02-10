"use client";

import {
  useState,
  useEffect,
  useRef,
  forwardRef,
} from "react";

/* ================= TYPES ================= */
type Item = {
  name: string;
  qty: number;
  rate: number;
  code?:string;
  total: number;
};

type ItemType = {
  _id: string;
  name: string;
  code?:string;

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
    const [query, setQuery] = useState(items[index].name);
    const [suggestions, setSuggestions] = useState<ItemType[]>([]);
    const [stockQty, setStockQty] = useState<number | null>(null);

    const suggestionTimer = useRef<NodeJS.Timeout | null>(null);
    const stockTimer = useRef<NodeJS.Timeout | null>(null);

    /* ---------- ITEM SUGGESTIONS ---------- */
    useEffect(() => {
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }

      if (suggestionTimer.current) {
        clearTimeout(suggestionTimer.current);
      }

      suggestionTimer.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/items?search=${query}`);
          if (res.ok) {
            setSuggestions(await res.json());
          }
        } catch {
          setSuggestions([]);
        }
      }, 300);

      return () => {
        if (suggestionTimer.current) {
          clearTimeout(suggestionTimer.current);
        }
      };
    }, [query]);

    /* ---------- STOCK CHECK ---------- */
    useEffect(() => {
      if (!query.trim()) {
        setStockQty(null);
        return;
      }

      if (stockTimer.current) {
        clearTimeout(stockTimer.current);
      }

      stockTimer.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `/api/stock/check?name=${encodeURIComponent(query)}`
          );
          if (res.ok) {
            const data = await res.json();
            setStockQty(data?.availableQty ?? 0);
          }
        } catch {
          setStockQty(null);
        }
      }, 300);

      return () => {
        if (stockTimer.current) {
          clearTimeout(stockTimer.current);
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
          className="border p-2 w-full"
          onChange={(e) => {
            setQuery(e.target.value);
            handleItemChange(index, e);
          }}
        />

        {/* STOCK STATUS */}
        {stockQty !== null && (
          <p className="text-xs mt-1">
            {stockQty > 0 ? (
              <span className="text-green-600">
                In stock: {stockQty}
              </span>
            ) : (
              <span className="text-orange-600">
                ⚠ Sold without stock
              </span>
            )}
          </p>
        )}

        {/* SUGGESTIONS */}
        {suggestions.length > 0 && (
          <ul className="absolute z-10 bg-white border w-full max-h-40 overflow-y-auto">
            {suggestions.map((item) => (
              <li
                key={item._id}
                className="px-2 py-1 cursor-pointer hover:bg-blue-100"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setQuery(item.name);
                  handleItemChange(index, {
                    target: {
                      name: "name",
                      value: item.name,
                    },
                  } as React.ChangeEvent<HTMLInputElement>);
                  setSuggestions([]);
                }}
              >
                {item.name} 
                {item.code && (
    <span className="text-xs text-gray-500 ml-2">
      ({item.code})
    </span>
  )}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

ItemNameInput.displayName = "ItemNameInput";
export default ItemNameInput;
