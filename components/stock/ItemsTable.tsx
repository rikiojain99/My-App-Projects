"use client";

import { StockItem } from "@/app/inventory/add-stock/page";
import ItemNameInput from "./ItemNameInput";

type Props = {
  items: StockItem[];
  expanded: boolean;
  toggle: () => void;
  handleItemChange: (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  addItem: () => void;
  removeItem: (index: number) => void;
  itemRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
};

export default function ItemsTable({
  items,
  expanded,
  toggle,
  handleItemChange,
  addItem,
  removeItem,
  itemRefs,
}: Props) {
  return (
    <div className="mb-6 border rounded-xl bg-white shadow-sm p-1.5">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold text-lg ml-2 text-black">
          Items ({items.length})
        </h2>

        <button
          type="button"
          onClick={toggle}
          className="w-8 h-8 flex items-center justify-center rounded-full border hover:bg-gray-100 transition"
        >
          {expanded ? "-" : "+"}
        </button>
      </div>

      {expanded && (
        <div className="grid grid-cols-36 gap-1 text-sm font-medium text-gray-500 border-b pb-1 mb-1">
          <div className="col-span-2 text-center">N.</div>
          <div className="col-span-4 text-center">Qty</div>
          <div className="col-span-16">Item</div>
          <div className="col-span-4 text-center">Rate</div>
          <div className="col-span-4 text-center">Total</div>
          <div className="col-span-2"></div>
        </div>
      )}  

      {expanded &&
        items.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-36 gap-1 items-start mb-2"
          >
            <div className="col-span-2 text-center font-medium text-gray-600 pt-2">
              {index + 1}
            </div>

            <input
              name="qty"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={item.qty === 0 ? "" : String(item.qty)}
              onChange={(e) => handleItemChange(index, e)}
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
              className="col-span-5 border rounded-lg py-2 px-0 text-center focus:ring-2 focus:ring-blue-400 outline-none"
            />

            <div className="col-span-17">
              <ItemNameInput
                value={item.name}
                onChange={(e) => handleItemChange(index, e)}
                inputRef={(el) => {
                  itemRefs.current[index] = el;
                }}
                onEnter={addItem}
              />
            </div>

            <input
              name="rate"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={item.rate === 0 ? "" : String(item.rate)}
              onChange={(e) => handleItemChange(index, e)}
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
              className="col-span-5 border rounded-lg py-2 px-0 text-center focus:ring-2 focus:ring-blue-400 outline-none"
            />

            <div className="col-span-5 border rounded-lg py-2 px-0 text-center font-semibold bg-gray-50">
              {item.total}
            </div>

            <div className="col-span-2 text-center pt-1">
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-500 hover:text-red-700 font-bold text-lg"
                >
                  x
                </button>
              )}
            </div>
          </div>
        ))}

      {expanded && (
        <div className="mt-3">
          <button
            type="button"
            onClick={addItem}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            + Add Item
          </button>
        </div>
      )}
    </div>
  );
}
