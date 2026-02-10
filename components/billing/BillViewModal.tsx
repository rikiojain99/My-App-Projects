"use client";

export default function BillViewModal({
  bill,
  onClose,
}: any) {
  if (!bill) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-xl p-5 max-h-[90vh] overflow-y-auto space-y-4">

        <h2 className="font-bold text-lg">
          {bill.customerId?.name}
        </h2>

        {bill.items.map((it: any, i: number) => (
          <div key={i} className="flex justify-between text-sm">
            <span>{it.name} × {it.qty}</span>
            <span>₹ {it.total}</span>
          </div>
        ))}

        <div className="border-t pt-2 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Total</span>
            <span>₹ {bill.grandTotal}</span>
          </div>

          {bill.discount > 0 && (
            <div className="flex justify-between text-orange-600">
              <span>Discount</span>
              <span>₹ {bill.discount}</span>
            </div>
          )}

          <div className="flex justify-between font-semibold">
            <span>Final</span>
            <span>
              ₹ {bill.finalTotal ?? bill.grandTotal}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full border rounded py-2"
        >
          Close
        </button>
      </div>
    </div>
  );
}
