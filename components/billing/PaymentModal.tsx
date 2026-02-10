"use client";

type PaymentMode = "cash" | "upi" | "split";

type Props = {
  customerName: string;
  finalTotal: number;
  discount: number;
  setDiscount: (n: number) => void;
  paymentMode: PaymentMode;
  setPaymentMode: (m: PaymentMode) => void;
  cashAmount: number;
  setCashAmount: (n: number) => void;
  upiAmount: number;
  upiId: string;
  setUpiId: (v: string) => void;
  upiAccount: string;
  setUpiAccount: (v: string) => void;
  onBack: () => void;
  onSave: () => void;
};

export default function PaymentModal({
  customerName,
  finalTotal,
  discount,
  setDiscount,
  paymentMode,
  setPaymentMode,
  cashAmount,
  setCashAmount,
  upiAmount,
  upiId,
  setUpiId,
  upiAccount,
  setUpiAccount,
  onBack,
  onSave,
}: Props) {
  const upiAccounts = ["ID-1", "ID-2", "ID-3"];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-5 shadow-xl">

        <h2 className="text-xl font-semibold text-center">
          {customerName}
        </h2>

        <div className="bg-gray-50 p-4 rounded-xl text-center">
          <p className="text-sm text-gray-500">Final Amount</p>
          <p className="text-2xl font-bold text-green-600">
            ₹ {finalTotal}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">
            Discount (₹)
          </label>
          <input
            type="number"
            value={discount}
            onChange={(e) =>
              setDiscount(Number(e.target.value))
            }
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div className="flex gap-2">
          {(["cash", "upi", "split"] as PaymentMode[]).map(
            (m) => (
              <button
                key={m}
                onClick={() => setPaymentMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  paymentMode === m
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100"
                }`}
              >
                {m.toUpperCase()}
              </button>
            )
          )}
        </div>

        {(paymentMode === "cash" ||
          paymentMode === "split") && (
          <input
            type="number"
            value={cashAmount}
            onChange={(e) =>
              setCashAmount(Number(e.target.value))
            }
            className="w-full border rounded-lg p-2"
            placeholder="Cash Amount"
          />
        )}

        {(paymentMode === "upi" ||
          paymentMode === "split") && (
          <>
            <div className="bg-gray-100 p-2 rounded-lg text-sm">
              UPI Amount: ₹ {upiAmount}
            </div>

            <select
              value={upiAccount}
              onChange={(e) =>
                setUpiAccount(e.target.value)
              }
              className="w-full border rounded-lg p-2"
            >
              <option value="">Select UPI Account</option>
              {upiAccounts.map((acc) => (
                <option key={acc} value={acc}>
                  {acc}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={upiId}
              onChange={(e) =>
                setUpiId(e.target.value)
              }
              className="w-full border rounded-lg p-2"
              placeholder="Customer UPI ID (optional)"
            />
          </>
        )}

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 border rounded-lg py-2"
          >
            Back
          </button>

          <button
            onClick={onSave}
            className="flex-1 bg-green-600 text-white rounded-lg py-2 font-semibold"
          >
            Save Bill
          </button>
        </div>
      </div>
    </div>
  );
}
