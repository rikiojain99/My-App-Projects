"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import ItemNameInput from "@/components/billing/ItemNameInput";
import PaymentModal from "@/components/billing/PaymentModal";

type Item = {
  name: string;
  qty: number;
  rate: number;
  total: number;
};

type PaymentMode = "cash" | "upi" | "split";

export default function FastBill() {
  const [items, setItems] = useState<Item[]>([
    { name: "", qty: 1, rate: 0, total: 0 },
  ]);

  const [showPayment, setShowPayment] = useState(false);
  const [message, setMessage] = useState("");

  /* ✅ ADD DISCOUNT STATE (Missing Before) */
  const [discount, setDiscount] = useState(0);

  const [paymentMode, setPaymentMode] =
    useState<PaymentMode>("cash");

  const [cashAmount, setCashAmount] = useState<number>(0);
  const [upiAmount, setUpiAmount] = useState<number>(0);
  const [upiId, setUpiId] = useState("");
  const [upiAccount, setUpiAccount] = useState("");

  const itemRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ================= TOTAL ================= */

  const grandTotal = useMemo(
    () => items.reduce((sum, item) => sum + (item.total || 0), 0),
    [items]
  );

  /* ✅ ADD FINAL TOTAL (Like AddBill) */
  const finalTotal = useMemo(
    () => Math.max(grandTotal - discount, 0),
    [grandTotal, discount]
  );

  /* ================= AUTO PAYMENT ================= */

  useEffect(() => {
    if (paymentMode === "cash") {
      setCashAmount(finalTotal);
      setUpiAmount(0);
    }

    if (paymentMode === "upi") {
      setCashAmount(0);
      setUpiAmount(finalTotal);
    }

    if (paymentMode === "split") {
      setCashAmount(finalTotal);
      setUpiAmount(0);
    }
  }, [paymentMode, finalTotal]);

  useEffect(() => {
    if (paymentMode === "split") {
      const remaining = finalTotal - cashAmount;
      setUpiAmount(remaining > 0 ? remaining : 0);
    }
  }, [cashAmount, finalTotal, paymentMode]);

  /* ================= ITEM CHANGE ================= */

  const handleItemChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    const updated = [...items];

    if (name === "name") updated[index].name = value;
    if (name === "qty") updated[index].qty = Number(value) || 0;
    if (name === "rate") updated[index].rate = Number(value) || 0;

    updated[index].total =
      updated[index].qty * updated[index].rate;

    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      { name: "", qty: 1, rate: 0, total: 0 },
    ]);

    setTimeout(() => {
      itemRefs.current[items.length]?.focus();
    }, 50);
  };

  const removeItem = (index: number) =>
    setItems(items.filter((_, i) => i !== index));

  /* ================= SAVE DAILY ENTRY ================= */

  const saveFastBill = async () => {
    if (finalTotal <= 0) {
      setMessage("❌ Total must be greater than 0");
      return;
    }

    if (cashAmount + upiAmount !== finalTotal) {
      setMessage("❌ Payment mismatch");
      return;
    }

    try {
      const res = await fetch("/api/daily-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          total: finalTotal,   // ✅ use finalTotal
          paymentMode,
          cashAmount,
          upiAmount,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessage(`❌ ${err.error}`);
        return;
      }

      setMessage("✅ Fast bill saved");

      setItems([{ name: "", qty: 1, rate: 0, total: 0 }]);
      setDiscount(0);
      setCashAmount(0);
      setUpiAmount(0);
      setShowPayment(false);

    } catch {
      setMessage("❌ Something went wrong");
    }
  };

  /* ================= UI ================= */

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto p-6 bg-white border rounded-xl space-y-6">

        <h1 className="text-2xl font-bold">
          Fast Bill
        </h1>

        {message && <p className="text-sm">{message}</p>}

        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-2 items-center"
            >
              <div className="col-span-1">
                {index + 1}.
              </div>

              <div className="col-span-4">
                <ItemNameInput
                  ref={(el: HTMLInputElement | null) => {
                    itemRefs.current[index] = el;
                  }}
                  index={index}
                  items={items}
                  handleItemChange={handleItemChange}
                />
              </div>

              <input
                name="qty"
                type="number"
                value={item.qty}
                onChange={(e) =>
                  handleItemChange(index, e)
                }
                className="col-span-2 border p-2"
              />

              <input
                name="rate"
                type="number"
                value={item.rate}
                onChange={(e) =>
                  handleItemChange(index, e)
                }
                className="col-span-2 border p-2"
              />

              <div className="col-span-2 text-right font-semibold">
                ₹ {item.total}
              </div>

              <div className="col-span-1 text-right">
                {items.length > 1 && (
                  <button
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
          onClick={addItem}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          + Add Item
        </button>

        <div className="flex justify-between border-t pt-4 text-lg font-bold">
          <span>Total</span>
          <span>₹ {finalTotal}</span>
        </div>

        <button
          onClick={() => setShowPayment(true)}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold"
        >
          Proceed to Payment
        </button>

        {showPayment && (
          <PaymentModal
            customerName="Walk-in"
            finalTotal={finalTotal}
            discount={discount}
            setDiscount={setDiscount}
            paymentMode={paymentMode}
            setPaymentMode={setPaymentMode}
            cashAmount={cashAmount}
            setCashAmount={setCashAmount}
            upiAmount={upiAmount}
            setUpiAmount={setUpiAmount}
            upiId={upiId}
            setUpiId={setUpiId}
            upiAccount={upiAccount}
            setUpiAccount={setUpiAccount}
            onBack={() => setShowPayment(false)}
            onSave={saveFastBill}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
