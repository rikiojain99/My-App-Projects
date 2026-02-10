"use client";

export default function BillCard({
  bill,
  onView,
  onEdit,
}: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center">

      <div onClick={onView} className="cursor-pointer">
        <p className="font-semibold">
          {bill.customerId?.name}
        </p>
        <p className="text-xs text-gray-500">
          {bill.customerId?.mobile}
        </p>
        <p className="text-xs text-gray-400">
          #{bill.billNo}
        </p>
      </div>

      <div className="text-right">
        <p className="font-bold text-lg">
          ₹ {bill.finalTotal ?? bill.grandTotal}
        </p>

        <button
          onClick={onEdit}
          className="text-xs text-blue-600 mt-1"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
