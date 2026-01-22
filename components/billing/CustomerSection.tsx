"use client";

import { useEffect, useRef } from "react";

/* ================= TYPES ================= */
export type Customer = {
  name: string;
  type: string;
  city: string;
  mobile: string;
};

type Props = {
  customer: Customer;
  setCustomer: React.Dispatch<React.SetStateAction<Customer>>;
  expanded: boolean;
  toggle: () => void;
  autoCollapseDelay?: number;
};

/* ================= COMPONENT ================= */
export default function CustomerSection({
  customer,
  setCustomer,
  expanded,
  toggle,
  autoCollapseDelay = 1500,
}: Props) {
  const collapseTimer = useRef<NodeJS.Timeout | null>(null);

  /* ---------- AUTO COLLAPSE ---------- */
  const autoCollapse = () => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(toggle, autoCollapseDelay);
  };

  /* ---------- HANDLE CHANGE ---------- */
  const handleChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setCustomer((p) => ({ ...p, [name]: value }));

    // Existing customer lookup
    if (name === "mobile" && value.length === 10) {
      try {
        const res = await fetch(`/api/customers?mobile=${value}`);
        if (res.ok) {
          const existing = await res.json();
          if (existing) {
            setCustomer(existing);
            autoCollapse();
          }
        }
      } catch {}
    }
  };

  /* ---------- AUTO COLLAPSE FOR NEW CUSTOMER ---------- */
  useEffect(() => {
    if (
      customer.name &&
      customer.type &&
      customer.mobile.length === 10
    ) {
      autoCollapse();
    }
  }, [customer.name, customer.type, customer.mobile]);

  /* ---------- UI ---------- */
  return (
    <div className="mb-4">
      <div className="flex justify-between">
        <h2 className="font-semibold text-black">
          Customer Details
        </h2>
        <button type="button" onClick={toggle}>
          {expanded ? "−" : "+"}
        </button>
      </div>

      {expanded && (
        <div className="space-y-2 mt-2">
          <input
            name="name"
            value={customer.name}
            onChange={handleChange}
            placeholder="Customer Name"
            className="w-full border p-2"
          />
          <input
            name="type"
            value={customer.type}
            onChange={handleChange}
            placeholder="Customer Type"
            className="w-full border p-2"
          />
          <input
            name="city"
            value={customer.city}
            onChange={handleChange}
            placeholder="City"
            className="w-full border p-2"
          />
          <input
            name="mobile"
            value={customer.mobile}
            onChange={handleChange}
            placeholder="Mobile"
            maxLength={10}
            className="w-full border p-2"
          />
        </div>
      )}
    </div>
  );
}
