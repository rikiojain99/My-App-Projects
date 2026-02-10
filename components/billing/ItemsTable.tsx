"use client";

import ItemNameInput from "@/components/billing/ItemNameInput";

/* ================= TYPES ================= */
type Item = {
  name: string;
  qty: number;
  rate: number;
  total: number;
};

type Props = {
  items: Item[];
  expanded: boolean;
  toggle: () => void;
  itemRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onItemChange: (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
};

/* ================= COMPONENT ================= */
export default function ItemsTable({
  items,
  expanded,
  toggle,
  itemRefs,
  onItemChange,
  onAddItem,
  onRemoveItem,
}: Props) {
  return (
    <div className="mb-4 border p-2">
      <div className="flex justify-between">
        <h2 className="font-semibold text-black text-lg">Items</h2>
        <button type="button" onClick={toggle}>
          {expanded ? "−" : "+"}
        </button>
      </div>

      {expanded &&
        items.map((item, i) => (
          <div
            key={i}
            className="grid grid-cols-5 gap-1 mt-2"
          >
            <ItemNameInput
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              index={i}
              items={items}
              handleItemChange={onItemChange}
            />

            <input
              name="qty"
              type="number"
              value={item.qty}
              onChange={(e) => onItemChange(i, e)}
              className="border p-1 text-center"
            />

            <input
              name="rate"
              type="number"
              value={item.rate}
              onChange={(e) => onItemChange(i, e)}
              className="border p-1 text-center"
            />

            <div className="border p-1 text-center">
              {item.total}
            </div>

            {items.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveItem(i)}
              >
                ✕
              </button>
            )}
          </div>
        ))}

      {expanded && (
        <button
          type="button"
          onClick={onAddItem}
          className="mt-2 bg-green-500 text-white px-3 py-1"
        >
          + Add Item
        </button>
      )}
    </div>
  );
}
