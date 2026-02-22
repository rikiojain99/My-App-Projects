"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import ItemsTable from "@/components/billing/ItemsTable";
import VendorPaymentModal from "@/components/vendor/VendorPaymentModal";

type Item = {
  name: string;
  qty: number;
  rate: number;
  total: number;
};

export default function VendorSalePage() {

  /* ================= VENDOR STATE ================= */

  const [vendorName, setVendorName] = useState("");
  const [vendorMobile, setVendorMobile] = useState("");
  const [vendorId, setVendorId] = useState<string | null>(null);

  const [vendorSuggestions, setVendorSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [vendorBlockExpanded, setVendorBlockExpanded] = useState(true);

  /* ================= ITEMS ================= */

  const [items, setItems] = useState<Item[]>([
    { name: "", qty: 1, rate: 0, total: 0 },
  ]);

  const itemRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [itemsExpanded, setItemsExpanded] = useState(true);

  /* ================= PAYMENT ================= */

  const [discount, setDiscount] = useState(0);
  const [cashPaid, setCashPaid] = useState(0);
  const [showPayment, setShowPayment] = useState(false);

  const [message, setMessage] = useState("");

  /* ================= TOTAL ================= */

  const grandTotal = useMemo(
    () => items.reduce((s, i) => s + i.total, 0),
    [items]
  );

  const finalTotal = useMemo(
    () => Math.max(grandTotal - discount, 0),
    [grandTotal, discount]
  );

  const creditAmount = useMemo(
    () => Math.max(finalTotal - cashPaid, 0),
    [finalTotal, cashPaid]
  );

  /* =========================================================
     VENDOR NAME SUGGESTION
  ========================================================= */

  useEffect(() => {
    if (vendorName.length < 2) {
      setVendorSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/vendors?search=${vendorName}`);
        if (res.ok) {
          setVendorSuggestions(await res.json());
          setShowSuggestions(true);
        }
      } catch {
        setVendorSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [vendorName]);

  /* =========================================================
     MOBILE AUTO FETCH
  ========================================================= */

  useEffect(() => {
    if (vendorMobile.length !== 10) return;

    const fetchVendor = async () => {
      try {
        const res = await fetch(`/api/vendors?mobile=${vendorMobile}`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setVendorName(data.name);
            setVendorId(data._id);
          }
        }
      } catch {}
    };

    fetchVendor();
  }, [vendorMobile]);

  /* =========================================================
     ITEM HANDLER
  ========================================================= */

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
  };

  const removeItem = (i: number) =>
    setItems(items.filter((_, idx) => idx !== i));

  /* =========================================================
     SAVE SALE
  ========================================================= */

  const saveVendorSale = async () => {
    if (!vendorId) {
      setMessage("❌ Select valid vendor");
      return;
    }

    if (finalTotal <= 0) {
      setMessage("❌ Invalid total");
      return;
    }

    try {
      const res = await fetch("/api/vendor-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: vendorId?.trim(),
          items,
          grandTotal,
          discount,
          finalTotal,
          cashPaid,
          creditAmount,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessage(`❌ ${err.error}`);
        return;
      }

      setMessage("✅ Vendor sale saved");

      // reset
      setItems([{ name: "", qty: 1, rate: 0, total: 0 }]);
      setDiscount(0);
      setCashPaid(0);
      setShowPayment(false);

    } catch {
      setMessage("❌ Something went wrong");
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl space-y-6">

        <h1 className="text-2xl font-bold">
          Vendor Sale
        </h1>

        {message && <p className="text-sm">{message}</p>}

        {/* ================= VENDOR BLOCK ================= */}

        <div className="border rounded-xl p-4 space-y-4">

          <div className="flex justify-between">
            <h2 className="font-semibold">
              Vendor Details
            </h2>
            <button
              onClick={() =>
                setVendorBlockExpanded((p) => !p)
              }
            >
              {vendorBlockExpanded ? "−" : "+"}
            </button>
          </div>

          {vendorBlockExpanded && (
            <>
              {/* Vendor Name */}
              <div className="relative">
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => {
                    setVendorName(e.target.value);
                    setVendorId(null);
                  }}
                  placeholder="Vendor Name"
                  className="w-full border p-2 rounded"
                />

                {showSuggestions &&
                  vendorSuggestions.length > 0 && (
                    <div className="absolute bg-white border w-full max-h-40 overflow-y-auto shadow z-20">
                      {vendorSuggestions.map((v) => (
                        <div
                          key={v._id}
                          onMouseDown={() => {
                            setVendorName(v.name.trim());
                            setVendorMobile(v.mobile.trim());
                            setVendorId(v._id.trim());
                            setShowSuggestions(false);
                          }}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {v.name} ({v.mobile})
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {/* Mobile */}
              <input
                type="text"
                value={vendorMobile}
                maxLength={10}
                onChange={(e) =>
                  setVendorMobile(e.target.value)
                }
                placeholder="Mobile Number"
                className="w-full border p-2 rounded"
              />
            </>
          )}
        </div>

        {/* ================= ITEMS ================= */}

        <ItemsTable
          items={items}
          expanded={itemsExpanded}
          toggle={() => setItemsExpanded((p) => !p)}
          itemRefs={itemRefs}
          onItemChange={handleItemChange}
          onAddItem={addItem}
          onRemoveItem={removeItem}
        />

        {/* ================= PAYMENT TRIGGER ================= */}

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

        {/* ================= PAYMENT MODAL ================= */}

        {showPayment && (
          <VendorPaymentModal
            vendorName={vendorName}
            grandTotal={grandTotal}
            discount={discount}
            setDiscount={setDiscount}
            finalTotal={finalTotal}
            cashPaid={cashPaid}
            setCashPaid={setCashPaid}
            creditAmount={creditAmount}
            onBack={() => setShowPayment(false)}
            onSave={saveVendorSale}
          />
        )}

      </div>
    </ProtectedRoute>
  );
}
