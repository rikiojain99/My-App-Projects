"use client";

import { useState, useEffect, useRef } from "react";

type ItemType = {
  _id: string;
  name: string;
  code?: string;
};

export default function BillEditModal({
  bill,
  onClose,
  onUpdated,
}: any) {
  const [loading, setLoading] = useState(false);
  const [editingBill, setEditingBill] = useState<any | null>(null);
  const [activeItemRow, setActiveItemRow] = useState<number | null>(
    null
  );
  const [itemSuggestions, setItemSuggestions] = useState<
    ItemType[]
  >([]);
  const [loadingSuggestions, setLoadingSuggestions] =
    useState(false);

  const numberKeys = [
    "Backspace",
    "Delete",
    "ArrowLeft",
    "ArrowRight",
    "Tab",
    "Home",
    "End",
  ];

  const suggestionTimerRef =
    useRef<NodeJS.Timeout | null>(null);
  const blurTimerRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionReqRef = useRef(0);

  useEffect(() => {
    setEditingBill(bill);
    setItemSuggestions([]);
    setActiveItemRow(null);
  }, [bill]);

  useEffect(() => {
    return () => {
      if (suggestionTimerRef.current) {
        clearTimeout(suggestionTimerRef.current);
      }
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
      }
    };
  }, []);

  if (!editingBill) return null;

  /* ================= ITEM QTY CHANGE ================= */
  const handleQtyChange = (index: number, qty: number) => {
    const items = [...editingBill.items];
    items[index].qty = qty;
    items[index].total = qty * items[index].rate;

    const grandTotal = items.reduce(
      (sum: number, i: any) => sum + i.total,
      0
    );

    setEditingBill({
      ...editingBill,
      items,
      grandTotal,
      finalTotal: grandTotal - (editingBill.discount || 0),
    });
  };

  /* ================= ITEM NAME CHANGE ================= */
  const handleItemNameChange = (
    index: number,
    rawValue: string
  ) => {
    const value = rawValue;
    const items = [...editingBill.items];
    items[index] = {
      ...items[index],
      name: value,
    };

    setEditingBill({
      ...editingBill,
      items,
    });

    setActiveItemRow(index);

    const query = value.trim();
    if (query.length < 2) {
      setItemSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    if (suggestionTimerRef.current) {
      clearTimeout(suggestionTimerRef.current);
    }

    setLoadingSuggestions(true);
    suggestionTimerRef.current = setTimeout(async () => {
      const reqId = ++suggestionReqRef.current;
      try {
        const res = await fetch(
          `/api/items?search=${encodeURIComponent(query)}`
        );
        if (!res.ok) {
          if (reqId === suggestionReqRef.current) {
            setItemSuggestions([]);
          }
          return;
        }

        const data: ItemType[] = await res.json();
        if (reqId !== suggestionReqRef.current) return;

        setItemSuggestions(Array.isArray(data) ? data : []);
      } catch {
        if (reqId === suggestionReqRef.current) {
          setItemSuggestions([]);
        }
      } finally {
        if (reqId === suggestionReqRef.current) {
          setLoadingSuggestions(false);
        }
      }
    }, 250);
  };

  const handleSelectItemName = (
    index: number,
    itemName: string
  ) => {
    const items = [...editingBill.items];
    items[index] = {
      ...items[index],
      name: itemName,
    };

    setEditingBill({
      ...editingBill,
      items,
    });

    setItemSuggestions([]);
    setActiveItemRow(null);
  };

  /* ================= DISCOUNT ================= */
  const handleDiscountChange = (value: number) => {
    setEditingBill({
      ...editingBill,
      discount: value,
      finalTotal: editingBill.grandTotal - value,
    });
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    setLoading(true);

    await fetch("/api/bills", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        billId: editingBill._id,
        updates: {
          items: editingBill.items,
          discount: editingBill.discount,
          grandTotal: editingBill.grandTotal,
          finalTotal: editingBill.finalTotal,
          paymentMode: editingBill.paymentMode,
          cashAmount: editingBill.cashAmount,
          upiAmount: editingBill.upiAmount,
          upiId: editingBill.upiId,
          upiAccount: editingBill.upiAccount,
        },
        customerUpdates: editingBill.customerId,
      }),
    });

    setLoading(false);
    onClose();
    onUpdated(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-xl bg-white p-5">
        <h2 className="text-lg font-semibold">Edit Bill</h2>

        {/* ================= CUSTOMER ================= */}
        {["name", "mobile", "city", "type"].map((field) => (
          <input
            key={field}
            value={editingBill.customerId?.[field] || ""}
            onChange={(e) =>
              setEditingBill({
                ...editingBill,
                customerId: {
                  ...editingBill.customerId,
                  [field]: e.target.value,
                },
              })
            }
            className="w-full rounded border p-2"
            placeholder={field}
          />
        ))}

        {/* ================= ITEMS ================= */}
        <div className="space-y-2">
          {editingBill.items.map((it: any, i: number) => (
            <div key={i} className="relative flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={it.name || ""}
                  onChange={(e) =>
                    handleItemNameChange(i, e.target.value)
                  }
                  onFocus={() => {
                    setActiveItemRow(i);
                    if (it.name?.trim().length >= 2) {
                      handleItemNameChange(i, it.name);
                    }
                    if (blurTimerRef.current) {
                      clearTimeout(blurTimerRef.current);
                    }
                  }}
                  onBlur={() => {
                    blurTimerRef.current = setTimeout(() => {
                      setItemSuggestions([]);
                      setActiveItemRow(null);
                    }, 120);
                  }}
                  placeholder="Item name"
                  className="w-full rounded border p-1.5 text-sm"
                />

                {activeItemRow === i &&
                  String(it.name || "").trim().length >= 2 && (
                  <div className="absolute left-0 right-[6.5rem] top-[calc(100%+0.2rem)] z-30 max-h-40 overflow-y-auto rounded border bg-white shadow">
                    {loadingSuggestions ? (
                      <p className="px-2 py-1 text-xs text-gray-500">
                        Loading...
                      </p>
                    ) : itemSuggestions.length > 0 ? (
                      <ul>
                        {itemSuggestions.map((item) => (
                          <li
                            key={item._id}
                            className="cursor-pointer px-2 py-1 text-sm hover:bg-blue-50"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectItemName(i, item.name);
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate">
                                {item.name}
                              </span>
                              {item.code && (
                                <span className="text-[11px] text-gray-500">
                                  {item.code}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="px-2 py-1 text-xs text-gray-500">
                        No matching item
                      </p>
                    )}
                  </div>
                )}
              </div>

              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={it.qty === 0 ? "" : String(it.qty)}
                onChange={(e) =>
                  handleQtyChange(
                    i,
                    Number(e.target.value.replace(/\D/g, "")) || 0
                  )
                }
                onKeyDown={(e) => {
                  if (e.ctrlKey || e.metaKey) return;
                  if (
                    !/^\d$/.test(e.key) &&
                    !numberKeys.includes(e.key)
                  ) {
                    e.preventDefault();
                  }
                }}
                className="w-20 rounded border p-1 text-right"
              />

              <div className="w-16 text-right text-sm">
                Rs. {it.total}
              </div>
            </div>
          ))}
        </div>

        {/* ================= DISCOUNT ================= */}
        <div>
          <label className="text-sm text-gray-500">
            Discount
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={
              editingBill.discount
                ? String(editingBill.discount)
                : ""
            }
            onChange={(e) =>
              handleDiscountChange(
                Number(e.target.value.replace(/\D/g, "")) || 0
              )
            }
            onKeyDown={(e) => {
              if (e.ctrlKey || e.metaKey) return;
              if (
                !/^\d$/.test(e.key) &&
                !numberKeys.includes(e.key)
              ) {
                e.preventDefault();
              }
            }}
            className="w-full rounded border p-2"
          />
        </div>

        {/* ================= PAYMENT EDIT ================= */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Payment Mode</p>

          {["cash", "upi", "split"].map((mode) => (
            <label key={mode} className="flex gap-2 text-sm">
              <input
                type="radio"
                checked={editingBill.paymentMode === mode}
                onChange={() =>
                  setEditingBill({
                    ...editingBill,
                    paymentMode: mode,
                  })
                }
              />
              {mode.toUpperCase()}
            </label>
          ))}

          {editingBill.paymentMode !== "upi" && (
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Cash Amount"
              value={
                editingBill.cashAmount
                  ? String(editingBill.cashAmount)
                  : ""
              }
              onChange={(e) =>
                setEditingBill({
                  ...editingBill,
                  cashAmount:
                    Number(e.target.value.replace(/\D/g, "")) || 0,
                })
              }
              onKeyDown={(e) => {
                if (e.ctrlKey || e.metaKey) return;
                if (
                  !/^\d$/.test(e.key) &&
                  !numberKeys.includes(e.key)
                ) {
                  e.preventDefault();
                }
              }}
              className="w-full rounded border p-2"
            />
          )}

          {editingBill.paymentMode !== "cash" && (
            <>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="UPI Amount"
                value={
                  editingBill.upiAmount
                    ? String(editingBill.upiAmount)
                    : ""
                }
                onChange={(e) =>
                  setEditingBill({
                    ...editingBill,
                    upiAmount:
                      Number(e.target.value.replace(/\D/g, "")) || 0,
                  })
                }
                onKeyDown={(e) => {
                  if (e.ctrlKey || e.metaKey) return;
                  if (
                    !/^\d$/.test(e.key) &&
                    !numberKeys.includes(e.key)
                  ) {
                    e.preventDefault();
                  }
                }}
                className="w-full rounded border p-2"
              />

              <input
                type="text"
                placeholder="UPI ID"
                value={editingBill.upiId || ""}
                onChange={(e) =>
                  setEditingBill({
                    ...editingBill,
                    upiId: e.target.value,
                  })
                }
                className="w-full rounded border p-2"
              />

              <input
                type="text"
                placeholder="UPI Account"
                value={editingBill.upiAccount || ""}
                onChange={(e) =>
                  setEditingBill({
                    ...editingBill,
                    upiAccount: e.target.value,
                  })
                }
                className="w-full rounded border p-2"
              />
            </>
          )}
        </div>

        {/* ================= TOTAL ================= */}
        <div className="border-t pt-2 text-sm">
          <div className="flex justify-between">
            <span>Grand</span>
            <span>Rs. {editingBill.grandTotal}</span>
          </div>

          <div className="flex justify-between font-semibold">
            <span>Final</span>
            <span>Rs. {editingBill.finalTotal}</span>
          </div>
        </div>

        {/* ================= ACTIONS ================= */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded border py-2"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 rounded bg-blue-600 py-2 text-white"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
