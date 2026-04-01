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
  finalTotal: number;
  creditAmount: number;
  paymentType: "paid" | "credit";
  createdAt: string;
};

type Props = {
  sale: VendorSale;
  onView: () => void;
};

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);

export default function VendorSaleCard({ sale, onView }: Props) {
  const itemCount = sale.items.reduce(
    (total, item) => total + Number(item.qty || 0),
    0
  );

  return (
    <button
      type="button"
      onClick={onView}
      className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold text-gray-900">
              {sale.vendor.name}
            </h2>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                sale.paymentType === "paid"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {sale.paymentType}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="rounded-full bg-gray-100 px-2 py-1">
              {new Date(sale.createdAt).toLocaleDateString("en-IN")}
            </span>
            {/* <span className="rounded-full bg-gray-100 px-2 py-1">
              {itemCount} qty
            </span> */}
            <span className="rounded-full bg-gray-100 px-2 py-1">
              {sale.vendor.city || "Unknown city"}
            </span>
            {/* <span className="rounded-full bg-gray-100 px-2 py-1">
              {sale.vendor.mobile || "No mobile"}
            </span> */}
            {/* {sale.deliveredBy && (
              <span className="rounded-full bg-gray-100 px-2 py-1">
                By {sale.deliveredBy}
              </span>
            )} */}
          </div>

          <p className="mt-3 truncate text-sm text-gray-600">
            {sale.items
              .slice(0, 3)
              .map((item) => item.name)
              .filter(Boolean)
              .join(", ") || "No items"}
            {sale.items.length > 3 ? ` +${sale.items.length - 3} more` : ""}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs text-gray-500">Final Total</p>
          <p className="text-lg font-bold text-gray-900">
            {formatINR(sale.finalTotal)}
          </p>
          {sale.creditAmount > 0 && (
            <p className="mt-1 text-xs font-medium text-rose-600">
              Credit {formatINR(sale.creditAmount)}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
