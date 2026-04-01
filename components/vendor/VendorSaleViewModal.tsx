"use client";

type VendorSale = {
  _id: string;
  vendor: {
    _id: string;
    name: string;
    mobile: string;
    city: string;
  };
  items: {
    name: string;
    qty: number;
    rate: number;
    total: number;
  }[];
  deliveredBy: string;
  grandTotal: number;
  discount: number;
  finalTotal: number;
  paymentType: "paid" | "credit";
  paymentMethod: "cash" | "upi" | "split" | null;
  oldBalance: number;
  newBalance: number;
  cashAmount: number;
  upiAmount: number;
  creditAmount: number;
  createdAt: string;
};

type Props = {
  sale: VendorSale | null;
  onClose: () => void;
};

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);

export default function VendorSaleViewModal({ sale, onClose }: Props) {
  if (!sale) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Vendor Estimate
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">
              {sale.vendor.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {new Date(sale.createdAt).toLocaleString("en-IN")}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Mobile</p>
            <p className="mt-1 font-medium text-gray-900">
              {sale.vendor.mobile || "-"}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">City</p>
            <p className="mt-1 font-medium text-gray-900">
              {sale.vendor.city || "-"}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Delivered By
            </p>
            <p className="mt-1 font-medium text-gray-900">
              {sale.deliveredBy || "-"}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Payment
            </p>
            <p className="mt-1 font-medium capitalize text-gray-900">
              {sale.paymentType}
              {sale.paymentMethod ? ` / ${sale.paymentMethod}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">Items</h3>
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            {sale.items.map((item, index) => (
              <div
                key={`${sale._id}-${index}`}
                className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 text-sm last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Qty {item.qty} x {formatINR(item.rate)}
                  </p>
                </div>
                <p className="font-semibold text-gray-900">
                  {formatINR(item.total)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-2 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm">
          <div className="flex items-center justify-between text-gray-600">
            <span>Grand Total</span>
            <span>{formatINR(sale.grandTotal)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex items-center justify-between text-orange-600">
              <span>Discount</span>
              <span>{formatINR(sale.discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between font-semibold text-gray-900">
            <span>Final Total</span>
            <span>{formatINR(sale.finalTotal)}</span>
          </div>
          {sale.cashAmount > 0 && (
            <div className="flex items-center justify-between text-gray-600">
              <span>Cash Paid</span>
              <span>{formatINR(sale.cashAmount)}</span>
            </div>
          )}
          {sale.upiAmount > 0 && (
            <div className="flex items-center justify-between text-gray-600">
              <span>UPI Paid</span>
              <span>{formatINR(sale.upiAmount)}</span>
            </div>
          )}
          {sale.creditAmount > 0 && (
            <div className="flex items-center justify-between font-medium text-rose-600">
              <span>Credit Added</span>
              <span>{formatINR(sale.creditAmount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-gray-600">
            <span>Previous Balance</span>
            <span>{formatINR(sale.oldBalance)}</span>
          </div>
          <div className="flex items-center justify-between font-medium text-gray-900">
            <span>New Balance</span>
            <span>{formatINR(sale.newBalance)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
