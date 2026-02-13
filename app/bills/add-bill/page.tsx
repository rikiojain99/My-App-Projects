"use client";
import { openWhatsApp } from "@/lib/whatsapp";
import { useState, useMemo, useRef, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import CustomerSection, { Customer } from "@/components/billing/CustomerSection";
import ItemsTable from "@/components/billing/ItemsTable";
import PreviousBillsModal from "@/components/billing/PreviousBillsModal";
import PaymentModal from "@/components/billing/PaymentModal";

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

  const [previousBills, setPreviousBills] = useState<any[]>([]);
  const [selectedBill, setSelectedBill] = useState<any | null>(null);
  const [upiAccount, setUpiAccount] = useState("");

  const [items, setItems] = useState<Item[]>([
    { name: "", qty: 1, rate: 0, total: 0 },
  ]);

  const [billNo] = useState(`BILL-${Date.now()}`);
  const [message, setMessage] = useState("");

  const [expanded, setExpanded] = useState({ 1: true, 2: true });
  const itemRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ---------------- SUCCESS POPUP STATE ---------------- */

  const [savedBillData, setSavedBillData] = useState<any | null>(null);

  /* ---------------- PAYMENT ---------------- */

  const [showPayment, setShowPayment] = useState(false);
  const [discount, setDiscount] = useState(0);

  const [paymentMode, setPaymentMode] =
    useState<PaymentMode>("cash");

  const [cashAmount, setCashAmount] = useState(0);
  const [upiAmount, setUpiAmount] = useState(0);
  const [upiId, setUpiId] = useState("");

  /* ---------------- PREVIOUS BILLS FETCH ---------------- */

  useEffect(() => {
    if (customer.mobile.length !== 10) {
      setPreviousBills([]);
      return;
    }

    const fetchPreviousBills = async () => {
      try {
        const res = await fetch(`/api/bills?mobile=${customer.mobile}`);
        const data = await res.json();
        if (res.ok) setPreviousBills(data.bills || []);
      } catch {
        setPreviousBills([]);
      }
    };

    fetchPreviousBills();
  }, [customer.mobile]);

  /* ---------------- TOTALS ---------------- */

  const grandTotal = useMemo(
    () => items.reduce((s, i) => s + i.total, 0),
    [items]
  );

  const finalTotal = useMemo(
    () => Math.max(grandTotal - discount, 0),
    [grandTotal, discount]
  );

  /* ---------------- AUTO SPLIT ---------------- */

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

  /* ---------------- ITEM LOGIC ---------------- */

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

  /* ---------------- SAVE BILL ---------------- */

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
          upiAccount: paymentMode !== "cash" ? upiAccount : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessage(`❌ ${err.error}`);
        return;
      }

      /* -------- SUCCESS -------- */

      setSavedBillData({
        billNo,
        mobile: customer.mobile,
        items,
        grandTotal,
        discount,
        finalTotal,
        paymentMode,
        cashAmount,
        upiAmount,
      });

      setShowPayment(false);

      // reset form
      setCustomer({ name: "", type: "", city: "", mobile: "" });
      setItems([{ name: "", qty: 1, rate: 0, total: 0 }]);
      setDiscount(0);
      setCashAmount(0);
      setUpiAmount(0);
      setUpiId("");
      setUpiAccount("");

    } catch {
      setMessage("❌ Something went wrong");
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto bg-white border rounded-xl p-4 space-y-6">

        <h1 className="text-3xl font-bold text-black">
          cheek 
        </h1>

        {message && <p className="text-sm">{message}</p>}

        <CustomerSection
          customer={customer}
          setCustomer={setCustomer}
          expanded={expanded[1]}
          toggle={() => setExpanded((p) => ({ ...p, 1: !p[1] }))}
        />

        <PreviousBillsModal
          selectedBill={selectedBill}
          setSelectedBill={setSelectedBill}
          previousBills={previousBills}
          customer={customer}
        />
        {previousBills.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
            <button
              onClick={() => setSelectedBill("LIST")}
              className="text-sm font-medium text-blue-700"
            >
              📄 Previous Bills ({previousBills.length})
            </button>
          </div>
        )}

        <ItemsTable
          items={items}
          expanded={expanded[2]}
          toggle={() => setExpanded((p) => ({ ...p, 2: !p[2] }))}
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

      {showPayment && (
        <PaymentModal
          customerName={customer.name}
          finalTotal={finalTotal}
          discount={discount}
          setDiscount={setDiscount}
          paymentMode={paymentMode}
          setPaymentMode={setPaymentMode}
          cashAmount={cashAmount}
          setCashAmount={setCashAmount}
          upiAmount={upiAmount}
          upiId={upiId}
          setUpiId={setUpiId}
          upiAccount={upiAccount}
          setUpiAccount={setUpiAccount}
          onBack={() => setShowPayment(false)}
          onSave={saveBill}
        />
      )}

      {/* ================= SUCCESS POPUP ================= */}

      {savedBillData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-sm rounded-xl p-6 space-y-4 text-center">

            <h2 className="text-lg font-semibold text-green-600">
              ✅ Bill Saved Successfully
            </h2>

            <button
              onClick={() => openWhatsApp(savedBillData)}
              className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold"
            >
              📲 Send WhatsApp
            </button>
            <button
              onClick={() => setSavedBillData(null)}
              className="w-full text-gray-500"
            >
              Done
            </button>

          </div>
        </div>
      )}

    </ProtectedRoute>
  );
}
