"use client";

type Props = {
  selectedBill: any | null;
  setSelectedBill: (val: any | null) => void;
  previousBills: any[];
  customer: {
    name: string;
    mobile: string;
  };
};

export default function PreviousBillsModal({
  selectedBill,
  setSelectedBill,
  previousBills,
  customer,
}: Props) {
  if (!selectedBill) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-xl max-h-[90vh] overflow-y-auto p-5 space-y-4">

        {/* ================= LIST VIEW ================= */}
        {selectedBill === "LIST" && (
          <>
            <h2 className="text-lg font-semibold">
              {customer.name} ({customer.mobile})
            </h2>

            <div className="space-y-2">
              {previousBills.map((bill) => (
                <div
                  key={bill._id}
                  onClick={() => setSelectedBill(bill)}
                  className="flex justify-between items-center border p-3 rounded cursor-pointer hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {bill.billNo}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(bill.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="font-semibold text-sm">
                    ₹ {bill.finalTotal ?? bill.grandTotal}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedBill(null)}
              className="w-full border rounded py-2"
            >
              Close
            </button>
          </>
        )}

        {/* ================= DETAIL VIEW ================= */}
        {selectedBill !== "LIST" && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {customer.name} ({customer.mobile})
              </h2>

              <button
                onClick={() => setSelectedBill("LIST")}
                className="text-sm text-blue-600"
              >
                ← Back
              </button>
            </div>

            <div className="text-sm text-gray-500">
              {selectedBill.billNo}
            </div>

            <div className="border-t pt-3 space-y-2">
              {selectedBill.items.map((it: any, i: number) => (
                <div
                  key={i}
                  className="flex justify-between text-sm border-b pb-1"
                >
                  <div>
                    {it.name}
                    <span className="text-xs text-gray-500 ml-1">
                      × {it.qty}
                    </span>
                  </div>

                  <div>
                    ₹ {it.rate} → ₹ {it.total}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span>Grand Total</span>
                <span>₹ {selectedBill.grandTotal}</span>
              </div>

              {selectedBill.discount > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Discount</span>
                  <span>₹ {selectedBill.discount}</span>
                </div>
              )}

              <div className="flex justify-between font-semibold">
                <span>Final</span>
                <span>
                  ₹ {selectedBill.finalTotal ?? selectedBill.grandTotal}
                </span>
              </div>

              <div className="text-xs text-gray-500 pt-2">
                Payment:{" "}
                {selectedBill.paymentMode?.toUpperCase() || "CASH"}
              </div>
            </div>

            <button
              onClick={() => setSelectedBill(null)}
              className="w-full border rounded py-2 mt-3"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
