"use client";

import { useState, useMemo, useRef } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

import CustomerSection, {
  Customer,
} from "@/components/billing/CustomerSection";
import ItemsTable from "@/components/billing/ItemsTable";

/* ================= TYPES ================= */
type Item = {
  name: string;
  qty: number;
  rate: number;
  total: number;
};

/* ================= ADD BILL PAGE ================= */
export default function AddBill() {
  /* ---------- STATE ---------- */
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    type: "",
    city: "",
    mobile: "",
  });

  const [items, setItems] = useState<Item[]>([
    { name: "", qty: 1, rate: 0, total: 0 },
  ]);

  const [message, setMessage] = useState("");
  const [billNo] = useState(`BILL-${Date.now()}`);

  const [expanded, setExpanded] = useState<{ [k: number]: boolean }>({
    1: true, // customer
    2: true, // items
  });

  const itemRefs = useRef<(HTMLInputElement | null)[]>([]);

  const grandTotal = useMemo(
    () => items.reduce((sum, i) => sum + i.total, 0),
    [items]
  );

  /* ---------- ITEMS LOGIC ---------- */
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
    const newItems = [
      ...items,
      { name: "", qty: 1, rate: 0, total: 0 },
    ];
    setItems(newItems);

    setTimeout(() => {
      itemRefs.current[newItems.length - 1]?.focus();
    }, 0);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  /* ---------- SUBMIT ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      // Save / update customer
      await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer),
      });

      // Save bill
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: customer.mobile,
          items,
          grandTotal,
          billNo,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessage(`❌ ${err.error}`);
        return;
      }

      setMessage("✅ Bill saved successfully");

      // Reset
      setCustomer({ name: "", type: "", city: "", mobile: "" });
      setItems([{ name: "", qty: 1, rate: 0, total: 0 }]);
      setExpanded({ 1: true, 2: true });
    } catch {
      setMessage("❌ Something went wrong");
    }
  };

  /* ---------- UI ---------- */
  return (
    <ProtectedRoute>
      <form
        onSubmit={handleSubmit}
        className="
          max-w-5xl mx-auto
          bg-white
          rounded-xl
          shadow-md
          border
          border-default
          p-4 md:p-8
          space-y-6
        "
      >
        {/* TITLE */}
        <div>
          <h1 className="text-2xl font-semibold text-black">
            Add Bill
          </h1>
          <p className="text-sm text-gray-500">
            Create a new customer bill
          </p>
        </div>

        {/* MESSAGE */}
        {message && (
          <div
            className={`p-3 rounded-md text-sm ${
              message.startsWith("❌")
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-green-50 text-green-700 border border-green-200"
            }`}
          >
            {message}
          </div>
        )}

        {/* ================= CUSTOMER ================= */}
        <CustomerSection
          customer={customer}
          setCustomer={setCustomer}
          expanded={expanded[1]}
          toggle={() =>
            setExpanded((p) => ({ ...p, 1: !p[1] }))
          }
        />

        {/* ================= ITEMS ================= */}
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

        {/* ================= GRAND TOTAL ================= */}
        <div className="flex justify-between items-center bg-gray-50 border border-default rounded-lg p-4">
          <span className="text-lg font-semibold text-black">
            Grand Total
          </span>
          <span className="text-xl font-bold text-blue-600">
            ₹ {grandTotal}
          </span>
        </div>

        {/* ================= SAVE ================= */}
        <button
          type="submit"
          className="
            w-full
            bg-blue-600
            hover:bg-blue-700
            text-white
            font-medium
            py-2.5
            rounded-lg
            transition
          "
        >
          Save Bill
        </button>
      </form>
    </ProtectedRoute>
  );
}
