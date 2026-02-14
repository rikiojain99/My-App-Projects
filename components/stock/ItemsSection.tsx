"use client";

import { StockItem } from "@/app/inventory/add-stoock/page";
import ItemNameInput from "./ItemNameInput";

type Props = {
  items: StockItem[];
  handleItemChange: any;
  addItem: () => void;
  removeItem: (index: number) => void;
  itemRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
};

export default function ItemsSection({
  items,
  handleItemChange,
  addItem,
  removeItem,
  itemRefs,
}: Props) {
  return (
    <>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-12 gap-2 items-center"
          >
            <div className="col-span-1 text-sm font-semibold text-gray-500">
              {index + 1}.
            </div>

            <div className="col-span-4">
              <ItemNameInput
                value={item.name}
                onChange={(e) => handleItemChange(index, e)}
                inputRef={(el) =>
                  (itemRefs.current[index] = el)
                }
                onEnter={addItem}
              />
            </div>

            <input
              name="qty"
              type="number"
              value={item.qty}
              onChange={(e) =>
                handleItemChange(index, e)
              }
              className="col-span-2 p-2 border rounded"
            />

            <input
              name="rate"
              type="number"
              value={item.rate}
              onChange={(e) =>
                handleItemChange(index, e)
              }
              className="col-span-2 p-2 border rounded"
            />

            <div className="col-span-2 text-right font-medium">
              ₹ {item.total}
            </div>

            <div className="col-span-1 text-right">
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-500"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        + Add Item
      </button>
    </>
  );
}
