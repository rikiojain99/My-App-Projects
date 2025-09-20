"use client";
import { useEffect, useState } from "react";

export default function TrashPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [passcode, setPasscode] = useState("");

  const fetchTrash = async () => {
    const res = await fetch("/api/bills?deleted=true");
    const data = await res.json();
    setBills(data);
  };

  const restoreBill = async (billId: string) => {
    await fetch("/api/bills", {
      method: "PUT",
      body: JSON.stringify({ billId }),
    });
    fetchTrash();
  };

  const deleteBill = async (billId: string) => {
    await fetch("/api/bills", {
      method: "DELETE",
      body: JSON.stringify({ billId, passcode }),
    });
    fetchTrash();
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Trash Bin</h1>
      <input
        type="password"
        placeholder="Enter Passcode"
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
        className="border p-2 rounded w-full mb-4 text-black"
      />
      {bills.map((bill) => (
        <div key={bill._id} className="p-3 border bg-gray-100 mb-2">
          <p>Total: ₹{bill.grandTotal}</p>
          <button
            onClick={() => restoreBill(bill._id)}
            className="bg-green-500 text-white px-2 py-1 rounded mr-2"
          >
            Restore
          </button>
          <button
            onClick={() => deleteBill(bill._id)}
            className="bg-red-500 text-white px-2 py-1 rounded"
          >
            Delete Permanently
          </button>
        </div>
      ))}
    </div>
  );
}
