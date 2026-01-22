"use client";

import { useState, useMemo, useRef } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import CustomerSection, { Customer } from "@/components/billing/CustomerSection";
import ItemsTable from "@/components/billing/ItemsTable";

type Item = {
  name: string;
  qty: number;
  rate: number;
  total: number;
};

type PaymentMode = "cash" | "upi" | "split";

export default function AddBill() {
  /* ---------------- STATE ---------------- */
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    type: "",
    city: "",
    mobile: "",
  });

  const [items, setItems] = useState<Item[]>([
    { name: "", qty: 1, rate: 0, total: 0 },
  ]);

  const [billNo] = useState(`BILL-${Date.now()}`);
  const [message, setMessage] = useState("");

  const [expanded, setExpanded] = useState({ 1: true, 2: true });
  const itemRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ---------------- PAYMENT ---------------- */
  const [showPayment, setShowPayment] = useState(false);
  const [discount, setDiscount] = useState(0);

  const [paymentMode, setPaymentMode] =
    useState<PaymentMode>("cash");

  const [cashAmount, setCashAmount] = useState(0);
  const [upiAmount, setUpiAmount] = useState(0);
  const [upiId, setUpiId] = useState("");

  /* ---------------- TOTALS ---------------- */
  const grandTotal = useMemo(
    () => items.reduce((s, i) => s + i.total, 0),
    [items]
  );

  const finalTotal = useMemo(
    () => Math.max(grandTotal - discount, 0),
    [grandTotal, discount]
  );

  /* ---------------- AUTO SPLIT LOGIC ---------------- */
  useMemo(() => {
    if (paymentMode === "cash") {
      setCashAmount(finalTotal);
      setUpiAmount(0);
    }

    if (paymentMode === "upi") {
      setCashAmount(0);
      setUpiAmount(finalTotal);
    }

    if (paymentMode === "split") {
      setUpiAmount(Math.max(finalTotal - cashAmount, 0));
    }
  }, [paymentMode, cashAmount, finalTotal]);

  /* ---------------- ITEMS LOGIC ---------------- */
  const handleItemChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const newItems = [...items];

    if (name === "name") newItems[index].name = value;
    if (name === "qty") newItems[index].qty = Number(value);
    if (name === "rate") newItems[index].rate = Number(value);

    newItems[index].total =
      newItems[index].qty * newItems[index].rate;

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { name: "", qty: 1, rate: 0, total: 0 }]);
    setTimeout(() => {
      itemRefs.current[itemRefs.current.length - 1]?.focus();
    }, 0);
  };

  const removeItem = (i: number) =>
    setItems(items.filter((_, idx) => idx !== i));

  /* ---------------- FINAL SAVE ---------------- */
  const saveBill = async () => {
    if (cashAmount + upiAmount !== finalTotal) {
      setMessage("❌ Payment total mismatch");
      return;
    }

    try {
      await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer),
      });

      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billNo,
          mobile: customer.mobile,
          items,
          grandTotal,
          discount,
          finalTotal,
          paymentMode,
          cashAmount,
          upiAmount,
          upiId: paymentMode !== "cash" ? upiId : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessage(`❌ ${err.error}`);
        return;
      }

      setMessage("✅ Bill saved successfully");
      setShowPayment(false);

      setCustomer({ name: "", type: "", city: "", mobile: "" });
      setItems([{ name: "", qty: 1, rate: 0, total: 0 }]);
      setDiscount(0);
      setCashAmount(0);
      setUpiAmount(0);
      setUpiId("");
    } catch {
      setMessage("❌ Something went wrong");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto bg-white border rounded-xl p-4 space-y-6">
        <h1 className="text-2xl font-bold text-black">
          Add Bill
        </h1>

        {message && <p className="text-sm">{message}</p>}

        <CustomerSection
          customer={customer}
          setCustomer={setCustomer}
          expanded={expanded[1]}
          toggle={() =>
            setExpanded((p) => ({ ...p, 1: !p[1] }))
          }
        />

        <ItemsTable
          items={items}
          expanded={expanded[2]}
          toggle={() =>
            setExpanded((p) => ({ ...p, 2: !p[2] }))
          }
          itemRefs={itemRefs}
          onItemChange={handleItemChange}
          onAddItem={addItem}
          onRemoveItem={removeItem}
        />

        <div className="flex justify-between bg-gray-50 border p-4 rounded-lg">
          <span className="font-semibold">Grand Total</span>
          <span className="font-bold text-lg">₹ {grandTotal}</span>
        </div>

        <button
          onClick={() => setShowPayment(true)}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold"
        >
          Next
        </button>
      </div>

      {/* ================= PAYMENT POPUP ================= */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-black">
              {customer.name || "Customer"}
            </h2>

            <div className="flex justify-between">
              <span>Final Amount</span>
              <span className="font-bold">₹ {finalTotal}</span>
            </div>

            <input
              type="number"
              placeholder="Discount"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-full border rounded p-2"
            />

            {/* PAYMENT MODE */}
            <div className="space-y-2">
              {(["cash", "upi", "split"] as PaymentMode[]).map(
                (m) => (
                  <label key={m} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={paymentMode === m}
                      onChange={() => setPaymentMode(m)}
                    />
                    {m.toUpperCase()}
                  </label>
                )
              )}
            </div>

            {paymentMode === "split" && (
              <input
                type="number"
                placeholder="Cash Amount"
                value={cashAmount}
                onChange={(e) =>
                  setCashAmount(Number(e.target.value))
                }
                className="w-full border rounded p-2"
              />
            )}

            {paymentMode !== "cash" && (
              <>
                <div className="text-sm text-gray-600">
                  UPI Amount: ₹ {upiAmount}
                </div>
                <input
                  type="text"
                  placeholder="UPI ID / App"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full border rounded p-2"
                />
              </>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 border rounded py-2"
              >
                Back
              </button>

              <button
                onClick={saveBill}
                className="flex-1 bg-green-600 text-white rounded py-2 font-bold"
              >
                Save Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
