"use client";

import ItemNameInput from "@/components/billing/ItemNameInput";

/* ================= TYPES ================= */
type Item = {
  qty: number;

  name: string;
  rate: number;
  total: number;
};

type Props = {
  items: Item[];
  expanded: boolean;
  toggle: () => void;
  qtyRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
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
  qtyRefs,
  itemRefs,
  onItemChange,
  onAddItem,
  onRemoveItem,
}: Props) {
  return (
    <div className="mb-6 border rounded-xl bg-white shadow-sm p-1.5">

      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold text-lg ml-2 text-black">
          Items ({items.length})
        </h2>

        <button
          type="button"
          onClick={toggle}
          className="w-8 h-8 flex items-center justify-center rounded-full border hover:bg-gray-100 transition"
        >
          {expanded ? "−" : "+"}
        </button>
      </div>

      {/* ================= TABLE HEADER ================= */}
      {expanded && (
        <div className="grid grid-cols-32 gap-2 text-sm font-medium text-gray-500 border-b pb-1 mb-1">
          <div className="col-span-2 text-center">N.</div>
          <div className="col-span-4 text-center">Qty</div>
          <div className="col-span-16">Item </div>
          <div className="col-span-4 text-center">Rate</div>
          <div className="col-span-4 text-center">Total</div>
          <div className="col-span-2"></div>
        </div>
      )}

      {/* ================= ROWS ================= */}
      {expanded &&
        items.map((item, i) => (
          <div
            key={i}
            className="grid grid-cols-32 gap-1 items-center mb-2"
          >
            {/* Row Number */}
            <div className="col-span-2 text-center font-medium text-gray-600">
              {i + 1}
            </div>

            {/* Quantity */}
            <input
              ref={(el) => {
                qtyRefs.current[i] = el;
              }}
              name="qty"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={item.qty === 0 ? "" : String(item.qty)}
              onChange={(e) => onItemChange(i, e)}
              onKeyDown={(e) => {
                if (e.ctrlKey || e.metaKey) return;
                if (
                  !/^\d$/.test(e.key) &&
                  ![
                    "Backspace",
                    "Delete",
                    "ArrowLeft",
                    "ArrowRight",
                    "Tab",
                    "Home",
                    "End",
                  ].includes(e.key)
                ) {
                  e.preventDefault();
                }
              }}
              className="col-span-4 border rounded-lg py-2 px-0 text-center focus:ring-2 focus:ring-blue-400 outline-none"
            />

            {/* Item Name */}
            <div className="col-span-16">
              <ItemNameInput
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                index={i}
                items={items}
                handleItemChange={onItemChange}
              />
            </div>

            {/* Rate */}
            <input
              name="rate"
              type="text"
              inputMode="decimal"
              pattern="[0-9.]*"
              value={item.rate === 0 ? "" : String(item.rate)}
              onChange={(e) => onItemChange(i, e)}
              onKeyDown={(e) => {
                if (e.ctrlKey || e.metaKey) return;
                if (
                  !/^\d$/.test(e.key) &&
                  ![
                    ".",
                    "Backspace",
                    "Delete",
                    "ArrowLeft",
                    "ArrowRight",
                    "Tab",
                    "Home",
                    "End",
                  ].includes(e.key)
                ) {
                  e.preventDefault();
                }
              }}
              className="col-span-4 border rounded-lg py-2 px-0 text-center focus:ring-2 focus:ring-blue-400 outline-none"
            />

            {/* Total */}
            <input
              name="total"
              type="text"
              inputMode="decimal"
              pattern="[0-9.]*"
              value={item.total === 0 ? "" : String(item.total)}
              onChange={(e) => onItemChange(i, e)}
              onKeyDown={(e) => {
                if (e.ctrlKey || e.metaKey) return;
                if (
                  !/^\d$/.test(e.key) &&
                  ![
                    ".",
                    "Backspace",
                    "Delete",
                    "ArrowLeft",
                    "ArrowRight",
                    "Tab",
                    "Home",
                    "End",
                  ].includes(e.key)
                ) {
                  e.preventDefault();
                }
              }}
              className="col-span-4 border rounded-lg py-2 px-0 text-center font-semibold bg-gray-50 focus:ring-2 focus:ring-blue-400 outline-none"
            />

            {/* Remove Button */}
            <div className="col-span-2 text-center">
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveItem(i)}
                  className="text-red-500 hover:text-red-700 font-bold text-lg"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}

      {/* ================= ADD BUTTON ================= */}
      {expanded && (
        <div className="mt-3">
          <button
            type="button"
            onClick={onAddItem}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            + Add Item
          </button>
        </div>
      )}
    </div>
  );
}
