"use client";

type Props = {
  extraExpense: number;
  setExtraExpense: (v: number) => void;
};

export default function ExpenseSection({
  extraExpense,
  setExtraExpense,
}: Props) {
  return (
    <div className="border-t pt-4 space-y-2">
      <label className="text-sm text-gray-600">
        Additional Purchase Expense
      </label>
      <input
        type="number"
        value={extraExpense}
        onChange={(e) =>
          setExtraExpense(Number(e.target.value))
        }
        className="w-full p-3 border rounded"
        placeholder="Transport / Loading / Other"
      />
    </div>
  );
}
