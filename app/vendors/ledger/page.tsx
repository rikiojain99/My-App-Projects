"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function VendorLedgerPage() {

  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [ledger, setLedger] = useState<any>(null);

  const [paymentAmount, setPaymentAmount] = useState(0);
  const [note, setNote] = useState("");

  /* ================= FETCH VENDORS ================= */

  useEffect(() => {
    fetch("/api/vendors")
      .then((res) => res.json())
      .then(setVendors);
  }, []);

  /* ================= FETCH LEDGER ================= */

  const fetchLedger = async () => {
    if (!selectedVendor) return;

    const res = await fetch(
      `/api/vendor-ledger?vendorId=${selectedVendor}`
    );

    const data = await res.json();
    setLedger(data);
  };

  useEffect(() => {
    fetchLedger();
  }, [selectedVendor]);

  /* ================= RECEIVE PAYMENT ================= */

  const receivePayment = async () => {
    if (!paymentAmount || paymentAmount <= 0) {
      alert("Enter valid amount");
      return;
    }

    const res = await fetch(
      "/api/vendor-payment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorId: selectedVendor,
          amount: paymentAmount,
          note,
        }),
      }
    );

    if (!res.ok) {
      alert("Payment failed");
      return;
    }

    setPaymentAmount(0);
    setNote("");
    fetchLedger();
  };

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl space-y-6">

        <h1 className="text-2xl font-bold">
          Vendor Ledger
        </h1>

        {/* ================= VENDOR SELECT ================= */}

        <select
          value={selectedVendor}
          onChange={(e) =>
            setSelectedVendor(e.target.value)
          }
          className="w-full border p-2 rounded"
        >
          <option value="">
            Select Vendor
          </option>
          {vendors.map((v) => (
            <option key={v._id} value={v._id}>
              {v.name}
            </option>
          ))}
        </select>

        {ledger && (
          <>
            {/* ================= SUMMARY ================= */}

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-red-50 border p-4 rounded-xl">
                <p className="text-sm text-gray-500">
                  Outstanding
                </p>
                <p className="text-2xl font-bold text-red-600">
                  ₹ {ledger.outstanding}
                </p>
              </div>

              <div className="bg-gray-50 border p-4 rounded-xl">
                <p className="text-sm text-gray-500">
                  Total Credit
                </p>
                <p className="text-xl font-semibold">
                  ₹ {ledger.totalCredit}
                </p>
              </div>

              <div className="bg-green-50 border p-4 rounded-xl">
                <p className="text-sm text-gray-500">
                  Total Paid
                </p>
                <p className="text-xl font-semibold">
                  ₹ {ledger.totalPayments}
                </p>
              </div>
            </div>

            {/* ================= RECEIVE PAYMENT ================= */}

            <div className="border rounded-xl p-4 space-y-3">
              <h2 className="font-semibold">
                Receive Payment
              </h2>

              <input
                type="number"
                value={paymentAmount}
                onChange={(e) =>
                  setPaymentAmount(
                    Number(e.target.value)
                  )
                }
                placeholder="Enter amount"
                className="w-full border p-2 rounded"
              />

              <input
                type="text"
                value={note}
                onChange={(e) =>
                  setNote(e.target.value)
                }
                placeholder="Note (optional)"
                className="w-full border p-2 rounded"
              />

              <button
                onClick={receivePayment}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Add Payment
              </button>
            </div>

            {/* ================= SALES TABLE ================= */}

            <div>
              <h2 className="font-semibold mb-2">
                Sales History
              </h2>

              <div className="space-y-2">
                {ledger.sales.map((sale: any) => (
                  <div
                    key={sale._id}
                    className="border p-3 rounded-lg"
                  >
                    <div className="flex justify-between">
                      <span>
                        ₹ {sale.finalTotal}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(
                          sale.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-red-600">
                      Credit: ₹ {sale.creditAmount}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ================= PAYMENT HISTORY ================= */}

            <div>
              <h2 className="font-semibold mb-2">
                Payment History
              </h2>

              <div className="space-y-2">
                {ledger.payments.map((p: any) => (
                  <div
                    key={p._id}
                    className="border p-3 rounded-lg bg-green-50"
                  >
                    <div className="flex justify-between">
                      <span>
                        ₹ {p.amount}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(
                          p.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>

                    {p.note && (
                      <div className="text-sm text-gray-600">
                        {p.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </>
        )}

      </div>
    </ProtectedRoute>
  );
}
