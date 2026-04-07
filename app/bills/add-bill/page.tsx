"use client";

import { openWhatsApp } from "@/lib/whatsapp";
import { useState, useMemo, useRef, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import CustomerSection, {
  Customer,
} from "@/components/billing/CustomerSection";
import ItemsTable from "@/components/billing/ItemsTable";
import PreviousBillsModal from "@/components/billing/PreviousBillsModal";
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

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const parseIntegerInput = (value: string) => {
  const digitsOnly = value.replace(/\D/g, "");
  return digitsOnly === "" ? 0 : Number(digitsOnly);
};

const parseMoneyInput = (value: string) => {
  const normalized = value.replace(/[^0-9.]/g, "");
  const [whole = "", ...rest] = normalized.split(".");
  const merged = rest.length > 0 ? `${whole}.${rest.join("")}` : whole;
  return merged === "" ? 0 : roundMoney(Number(merged));
};

const isSameAmount = (a: number, b: number) =>
  Math.abs(roundMoney(a) - roundMoney(b)) < 0.01;

const generateBillNo = () =>
  `BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export default function AddBill() {
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    type: "",
    city: "",
    mobile: "",
  });

  const [previousBills, setPreviousBills] = useState<any[]>([]);
  const [selectedBill, setSelectedBill] = useState<any | null>(
    null
  );
  const [upiAccount, setUpiAccount] = useState("");

  const [items, setItems] = useState<Item[]>([
    { name: "", qty: 0, rate: 0, total: 0 },
  ]);

  const [billNo, setBillNo] = useState(generateBillNo);
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

  const [expanded, setExpanded] = useState({
    1: true,
    2: true,
  });
  const qtyRefs = useRef<(HTMLInputElement | null)[]>([]);
  const itemRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [savedBillData, setSavedBillData] = useState<any | null>(
    null
  );

  const [showPayment, setShowPayment] = useState(false);
  const [isSavingBill, setIsSavingBill] = useState(false);
  const [discount, setDiscount] = useState(0);

  const [paymentMode, setPaymentMode] =
    useState<PaymentMode>("cash");

  const [cashAmount, setCashAmount] = useState(0);
  const [upiAmount, setUpiAmount] = useState(0);
  const [upiId, setUpiId] = useState("");

  const [draftLoaded, setDraftLoaded] = useState(false);
  const BILL_DRAFT_STORAGE_KEY = "add-bill-draft";
  const draftRef = useRef({
    customer,
    items,
    billNo,
    discount,
    paymentMode,
    cashAmount,
    upiAmount,
    upiId,
    upiAccount,
    expanded,
  });
  const draftPresentRef = useRef(false);

  const isDraftPresent = useMemo(() => {
    const hasCustomer = Object.values(customer).some(
      (value) => value.trim().length > 0
    );
    const hasItems = items.some(
      (item) =>
        item.name.trim().length > 0 || item.qty > 0 || item.rate > 0
    );
    const hasPayment =
      discount !== 0 ||
      paymentMode !== "cash" ||
      cashAmount !== 0 ||
      upiAmount !== 0 ||
      upiId.trim().length > 0 ||
      upiAccount.trim().length > 0;

    return hasCustomer || hasItems || hasPayment;
  }, [customer, items, discount, paymentMode, cashAmount, upiAmount, upiId, upiAccount]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const restoreDraft = () => {
      const raw = window.localStorage.getItem(BILL_DRAFT_STORAGE_KEY);
      if (!raw) {
        setDraftLoaded(true);
        return;
      }

      try {
        const data = JSON.parse(raw);
        if (!data || typeof data !== "object") {
          setDraftLoaded(true);
          return;
        }

        setCustomer(
          data.customer ?? {
            name: "",
            type: "",
            city: "",
            mobile: "",
          }
        );
        setItems(
          Array.isArray(data.items) && data.items.length > 0
            ? data.items
            : [{ name: "", qty: 0, rate: 0, total: 0 }]
        );
        setBillNo(data.billNo || generateBillNo());
        setDiscount(Number(data.discount ?? 0));
        setPaymentMode(data.paymentMode || "cash");
        setCashAmount(Number(data.cashAmount ?? 0));
        setUpiAmount(Number(data.upiAmount ?? 0));
        setUpiId(data.upiId || "");
        setUpiAccount(data.upiAccount || "");
        setExpanded(data.expanded ?? { 1: true, 2: true });
      } catch {
        // ignore invalid draft data
      } finally {
        setDraftLoaded(true);
      }
    };

    restoreDraft();
    window.addEventListener("pageshow", restoreDraft);
    return () => {
      window.removeEventListener("pageshow", restoreDraft);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !draftLoaded) return;

    const draft = {
      customer,
      items,
      billNo,
      discount,
      paymentMode,
      cashAmount,
      upiAmount,
      upiId,
      upiAccount,
      expanded,
    };

    draftRef.current = draft;
    draftPresentRef.current = isDraftPresent;

    const shouldSave =
      isDraftPresent ||
      (items.length === 1 && items[0].name === "" && items[0].qty === 0 && items[0].rate === 0);

    if (!shouldSave) {
      window.localStorage.removeItem(BILL_DRAFT_STORAGE_KEY);
      return;
    }

    try {
      window.localStorage.setItem(
        BILL_DRAFT_STORAGE_KEY,
        JSON.stringify(draft)
      );
    } catch {
      // ignore storage errors
    }
  }, [draftLoaded, customer, items, billNo, discount, paymentMode, cashAmount, upiAmount, upiId, upiAccount, expanded, isDraftPresent]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!draftPresentRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };

    const handlePageHide = () => {
      if (!draftPresentRef.current) {
        window.localStorage.removeItem(BILL_DRAFT_STORAGE_KEY);
        return;
      }

      try {
        window.localStorage.setItem(
          BILL_DRAFT_STORAGE_KEY,
          JSON.stringify(draftRef.current)
        );
      } catch {
        // ignore storage errors
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  useEffect(() => {
    if (customer.mobile.length !== 10) {
      setPreviousBills([]);
      return;
    }

    const fetchPreviousBills = async () => {
      try {
        const res = await fetch(
          `/api/bills?mobile=${customer.mobile}`
        );
        const data = await res.json();
        if (res.ok) {
          setPreviousBills(data.bills || []);
        }
      } catch {
        setPreviousBills([]);
      }
    };

    fetchPreviousBills();
  }, [customer.mobile]);

  const grandTotal = useMemo(
    () =>
      roundMoney(
        items.reduce(
          (sum, item) =>
            sum +
            Number(item.qty || 0) * Number(item.rate || 0),
          0
        )
      ),
    [items]
  );

  const roundedGrandTotal = useMemo(
    () => Math.round(grandTotal),
    [grandTotal]
  );

  const finalTotal = useMemo(
    () => Math.max(roundMoney(roundedGrandTotal - discount), 0),
    [roundedGrandTotal, discount]
  );

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

  const handleItemChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const newItems = [...items];
    const nextItem = { ...newItems[index] };

    if (name === "name") {
      nextItem.name = value;
    }

    if (name === "qty" || name === "rate" || name === "total") {
      if (name === "qty") nextItem.qty = parseIntegerInput(value);
      if (name === "rate") nextItem.rate = parseMoneyInput(value);
      if (name === "total") nextItem.total = parseMoneyInput(value);
    }

    if (name === "total") {
      nextItem.rate =
        nextItem.qty > 0
          ? roundMoney(nextItem.total / nextItem.qty)
          : 0;
      nextItem.total = roundMoney(nextItem.total);
    } else {
      nextItem.total = roundMoney(
        nextItem.qty * nextItem.rate
      );
    }

    newItems[index] = nextItem;
    setItems(newItems);
  };

  const addItem = () => {
    const nextIndex = items.length;
    setItems([
      ...items,
      { name: "", qty: 0, rate: 0, total: 0 },
    ]);

    setTimeout(() => {
      qtyRefs.current[nextIndex]?.focus();
    }, 0);
  };

  const removeItem = (index: number) =>
    setItems(items.filter((_, i) => i !== index));

  const showError = (message: string) => {
    setSavePopup({
      open: true,
      status: "error",
      title: "Save failed",
      message,
    });
  };

  const saveBill = async () => {

    const normalizedMobile = customer.mobile.trim();
    if (normalizedMobile.length !== 10) {
      showError("Enter valid 10-digit mobile number");
      return false;
    }

    if (!customer.name.trim() || !customer.type.trim()) {
      showError("Customer name and type are required");
      return false;
    }

    const normalizedItems = items.map((item) => ({
      name: (item.name || "").trim(),
      qty: Number(item.qty || 0),
      rate: Number(item.rate || 0),
      total: roundMoney(
        Number(item.qty || 0) * Number(item.rate || 0)
      ),
    }));

    const validItems = normalizedItems.filter(
      (item) =>
        item.name.length > 0 &&
        Number.isFinite(item.qty) &&
        item.qty > 0 &&
        Number.isFinite(item.rate) &&
        item.rate >= 0
    );

    if (validItems.length === 0) {
      showError("Add at least one valid item");
      return false;
    }

    const hasInvalidRows = normalizedItems.some((item) => {
      const hasAnyInput =
        item.name.length > 0 || item.qty > 0 || item.rate > 0;

      if (!hasAnyInput) return false;

      return (
        item.name.length === 0 ||
        !Number.isFinite(item.qty) ||
        item.qty <= 0 ||
        !Number.isFinite(item.rate) ||
        item.rate < 0
      );
    });

    if (hasInvalidRows) {
      showError("Fix invalid item rows before saving");
      return false;
    }

    const computedGrandTotal = roundMoney(
      validItems.reduce((sum, item) => sum + item.total, 0)
    );
    const safeDiscount = Math.max(Number(discount || 0), 0);
    const computedFinalTotal = Math.max(
      roundMoney(computedGrandTotal - safeDiscount),
      0
    );

    if (computedGrandTotal <= 0) {
      showError("Total must be greater than 0");
      return false;
    }

    if (
      !isSameAmount(
        Number(cashAmount || 0) + Number(upiAmount || 0),
        computedFinalTotal
      )
    ) {
      showError("Payment total mismatch");
      return false;
    }

    setSavePopup({
      open: true,
      status: "saving",
      title: "Saving estimate",
      message: "Please wait while we save estimate data.",
    });

    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billNo,
          mobile: normalizedMobile,
          customer: {
            name: customer.name.trim(),
            type: customer.type.trim(),
            city: customer.city.trim(),
          },
          items: validItems,
          grandTotal: computedGrandTotal,
          discount: safeDiscount,
          finalTotal: computedFinalTotal,
          paymentMode,
          cashAmount,
          upiAmount,
          upiId: paymentMode !== "cash" ? upiId : null,
          upiAccount:
            paymentMode !== "cash" ? upiAccount : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        showError(err?.error || "Failed to save estimate");
        return false;
      }

      setSavedBillData({
        billNo,
        customerName: customer.name,
        mobile: normalizedMobile,
        items: validItems,
        grandTotal: computedGrandTotal,
        discount: safeDiscount,
        finalTotal: computedFinalTotal,
        paymentMode,
        cashAmount,
        upiAmount,
      });

      window.localStorage.removeItem(BILL_DRAFT_STORAGE_KEY);
      setShowPayment(false);
      setCustomer({ name: "", type: "", city: "", mobile: "" });
      setItems([{ name: "", qty: 0, rate: 0, total: 0 }]);
      setDiscount(0);
      setCashAmount(0);
      setUpiAmount(0);
      setUpiId("");
      setUpiAccount("");
      setBillNo(generateBillNo());
      setSavePopup((prev) => ({ ...prev, open: false }));
      return true;
    } catch {
      showError("Something went wrong");
      return false;
    }
  };

  const handleSaveBill = async () => {
    if (isSavingBill) return;

    setIsSavingBill(true);
    try {
      await saveBill();
    } finally {
      setIsSavingBill(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto bg-white border rounded-xl p-4 space-y-6">
        <h1 className="text-3xl font-bold text-black">Add Estimate</h1>

        <CustomerSection
          customer={customer}
          setCustomer={setCustomer}
          expanded={expanded[1]}
          toggle={() =>
            setExpanded((prev) => ({ ...prev, 1: !prev[1] }))
          }
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
              Previous Estimates ({previousBills.length})
            </button>
          </div>
        )}

        <ItemsTable
          items={items}
          expanded={expanded[2]}
          toggle={() =>
            setExpanded((prev) => ({ ...prev, 2: !prev[2] }))
          }
          qtyRefs={qtyRefs}
          itemRefs={itemRefs}
          onItemChange={handleItemChange}
          onAddItem={addItem}
          onRemoveItem={removeItem}
        />

        <div className="flex justify-between bg-gray-50 border p-4 rounded-lg">
          <span className="font-semibold">Grand Total</span>
          <span className="font-bold text-lg">Rs. {roundedGrandTotal}</span>
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
          setUpiAmount={setUpiAmount}
          cashAmount={cashAmount}
          setCashAmount={setCashAmount}
          upiAmount={upiAmount}
          upiId={upiId}
          setUpiId={setUpiId}
          upiAccount={upiAccount}
          setUpiAccount={setUpiAccount}
          onBack={() => setShowPayment(false)}
          onSave={handleSaveBill}
          isSaving={isSavingBill}
        />
      )}

      {savedBillData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-sm rounded-xl p-6 space-y-4 text-center">
            <h2 className="text-lg font-semibold text-green-600">
              Estimate Saved Successfully
            </h2>

            <button
              onClick={() => openWhatsApp(savedBillData)}
              className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold"
            >
              Send WhatsApp
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
