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
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={extraExpense === 0 ? "" : String(extraExpense)}
        onChange={(e) =>
          setExtraExpense(
            Number(e.target.value.replace(/\D/g, "")) || 0
          )
        }
        onKeyDown={(e) => {
          if (e.ctrlKey || e.metaKey) return;
          if (
            !/^\d$/.test(e.key) &&
            ![
              "Backspace",
              "Delete",
              "ArrowLeft",
              "ArrowRight",
              "Tab",
              "Home",
              "End",
            ].includes(e.key)
          ) {
            e.preventDefault();
          }
        }}
        className="w-full p-3 border rounded"
        placeholder="Transport / Loading / Other"
      />
    </div>
  );
}
