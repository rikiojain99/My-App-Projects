"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import ItemsTable from "@/components/billing/ItemsTable";
import PaymentModal from "@/components/billing/PaymentModal";
import SaveStatusPopup, {
  type SavePopupStatus,
} from "@/components/ui/SaveStatusPopup";

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

  const [expanded, setExpanded] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [message, setMessage] = useState("");
  const [savePopup, setSavePopup] = useState<{
    open: boolean;
    status: SavePopupStatus;
    title: string;
    message: string;
  }>({
    open: false,
    status: "saving",
    title: "",
    message: "",
  });

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
      setMessage("Total must be greater than 0");
      setSavePopup({
        open: true,
        status: "error",
        title: "Save failed",
        message: "Total must be greater than 0",
      });
      return;
    }

    if (cashAmount + upiAmount !== finalTotal) {
      setMessage("Payment mismatch");
      setSavePopup({
        open: true,
        status: "error",
        title: "Save failed",
        message: "Payment mismatch",
      });
      return;
    }

    try {
      setSavePopup({
        open: true,
        status: "saving",
        title: "Saving fast bill",
        message: "Please wait while we save data.",
      });

      const res = await fetch("/api/daily-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          total: finalTotal,
          paymentMode,
          cashAmount,
          upiAmount,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        const errMsg = err?.error || "Failed to save fast bill";
        setMessage(errMsg);
        setSavePopup({
          open: true,
          status: "error",
          title: "Save failed",
          message: errMsg,
        });
        return;
      }

      setMessage("Fast bill saved");
      setSavePopup({
        open: true,
        status: "success",
        title: "Fast bill saved",
        message: "Data has been saved successfully.",
      });

      setItems([{ name: "", qty: 1, rate: 0, total: 0 }]);
      setDiscount(0);
      setCashAmount(0);
      setUpiAmount(0);
      setShowPayment(false);
    } catch {
      setMessage("Something went wrong");
      setSavePopup({
        open: true,
        status: "error",
        title: "Save failed",
        message: "Something went wrong",
      });
    }
  };

  /* ================= UI ================= */

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto bg-white border rounded-xl p-6 space-y-6 shadow-sm">
        <h1 className="text-2xl font-bold">Cash Bill</h1>

        {message && <p className="text-sm">{message}</p>}

        <ItemsTable
          items={items}
          expanded={expanded}
          toggle={() => setExpanded((p) => !p)}
          itemRefs={itemRefs}
          onItemChange={handleItemChange}
          onAddItem={addItem}
          onRemoveItem={removeItem}
        />

        <div className="flex justify-between border-t pt-4 text-lg font-bold">
          <span>Total</span>
          <span>Rs. {finalTotal}</span>
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

      <SaveStatusPopup
        open={savePopup.open}
        status={savePopup.status}
        title={savePopup.title}
        message={savePopup.message}
        onClose={() =>
          setSavePopup((prev) => ({ ...prev, open: false }))
        }
      />
    </ProtectedRoute>
  );
}
