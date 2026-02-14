"use client";

type Props = {
  subTotal: number;
  extraExpense: number;
  grandTotal: number;
};

export default function TotalsSection({
  subTotal,
  extraExpense,
  grandTotal,
}: Props) {
  return (
    <div className="space-y-1 border-t pt-4 text-lg">
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>₹ {subTotal}</span>
      </div>

      {extraExpense > 0 && (
        <div className="flex justify-between text-orange-600">
          <span>Extra Expense</span>
          <span>₹ {extraExpense}</span>
        </div>
      )}

      <div className="flex justify-between font-bold text-xl">
        <span>Grand Total</span>
        <span>₹ {grandTotal}</span>
      </div>
    </div>
  );
}
