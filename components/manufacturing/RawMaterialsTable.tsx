"use client";

export type ManufacturingRawInput = {
  itemName: string;
  qtyUsed: number;
  rate: number;
  cost: number;
  availableQty?: number;
  fromStock: boolean;
};

export type ManufacturingLookupItem = {
  itemName: string;
  rate: number;
  availableQty: number;
};

type Props = {
  inputs: ManufacturingRawInput[];
  activeRow: number | null;
  suggestions: ManufacturingLookupItem[];
  disabled?: boolean;
  onLookupItem: (query: string, rowIndex: number) => void;
  onSelectItem: (
    rowIndex: number,
    item: ManufacturingLookupItem
  ) => void;
  onQtyChange: (rowIndex: number, qty: number) => void;
  onRateChange: (rowIndex: number, rate: number) => void;
  onAddRow: () => void;
  onRemoveRow: (rowIndex: number) => void;
};

export default function RawMaterialsTable({
  inputs,
  activeRow,
  suggestions,
  disabled = false,
  onLookupItem,
  onSelectItem,
  onQtyChange,
  onRateChange,
  onAddRow,
  onRemoveRow,
}: Props) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="border p-2 text-left">Raw Item</th>
              <th className="border p-2">Qty</th>
              <th className="border p-2">Rate</th>
              <th className="border p-2">Cost</th>
              <th className="border p-2"></th>
            </tr>
          </thead>

          <tbody>
            {inputs.map((row, i) => (
              <tr key={`${i}-${row.itemName}`}>
                <td className="border p-2 relative">
                  <input
                    value={row.itemName ?? ""}
                    onChange={(e) =>
                      onLookupItem(e.target.value, i)
                    }
                    className="w-full border p-1 rounded"
                    autoComplete="off"
                    disabled={disabled}
                  />

                  {activeRow === i &&
                    suggestions.length > 0 && (
                      <div className="absolute z-50 bg-white border w-full shadow max-h-52 overflow-y-auto">
                        {suggestions.map((s) => (
                          <div
                            key={s.itemName}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              if (!disabled) {
                                onSelectItem(i, s);
                              }
                            }}
                            className={`px-2 py-1 ${
                              disabled
                                ? "text-gray-400 cursor-not-allowed"
                                : "hover:bg-blue-100 cursor-pointer"
                            }`}
                          >
                            {s.itemName} - Rs.{s.rate} (Stock:{" "}
                            {s.availableQty})
                          </div>
                        ))}
                      </div>
                    )}

                  {row.fromStock &&
                    row.availableQty !== undefined &&
                    row.qtyUsed > row.availableQty && (
                      <p className="text-xs text-red-600 mt-1">
                        Only {row.availableQty} in stock
                      </p>
                    )}
                </td>

                <td className="border p-2">
                  <input
                    type="number"
                    min={0}
                    value={
                      Number.isFinite(row.qtyUsed)
                        ? row.qtyUsed
                        : 0
                    }
                    onChange={(e) =>
                      onQtyChange(i, Number(e.target.value))
                    }
                    className="w-full border p-1 rounded"
                    disabled={disabled}
                  />
                </td>

                <td className="border p-2 text-center">
                  {row.fromStock ? (
                    <span>Rs.{row.rate}</span>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      value={
                        Number.isFinite(row.rate)
                          ? row.rate
                          : 0
                      }
                      onChange={(e) =>
                        onRateChange(i, Number(e.target.value))
                      }
                      className="w-full border p-1 rounded"
                      disabled={disabled}
                    />
                  )}
                </td>

                <td className="border p-2 text-center">
                  Rs.{Math.round(row.cost || 0)}
                </td>

                <td className="border p-2 text-center">
                  {inputs.length > 1 && (
                    <button
                      onClick={() => onRemoveRow(i)}
                      className="text-red-600 disabled:text-gray-400"
                      disabled={disabled}
                    >
                      x
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={onAddRow}
        className="mt-3 px-3 py-1 border rounded bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
        disabled={disabled}
      >
        + Add Raw Material
      </button>
    </>
  );
}
