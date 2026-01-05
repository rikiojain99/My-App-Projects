"use client";
import { useEffect, useState } from "react";

export default function ViewBills() {
  const [bills, setBills] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState("");
  const [editingBill, setEditingBill] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [dashboardCustomer, setDashboardCustomer] = useState<any | null>(null);

  // Fetch bills with pagination
  async function fetchBills(newPage = 1) {
    const res = await fetch(`/api/bills?page=${newPage}&limit=10`);
    const data = await res.json();

    if (newPage === 1) {
      setBills(data.bills);
    } else {
      setBills((prev) => [...prev, ...data.bills]);
    }

    setPage(data.currentPage);
    setHasMore(data.currentPage < data.totalPages);
  }

  useEffect(() => {
    fetchBills(1);

    // Infinite scroll listener
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 100 >=
        document.documentElement.scrollHeight
      ) {
        if (hasMore) {
          fetchBills(page + 1);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [page, hasMore]);

  // Filter bills by name or mobile
  const filteredBills = bills.filter(
    (bill) =>
      bill.customerId?.name?.toLowerCase().includes(filter.toLowerCase()) ||
      bill.customerId?.mobile?.includes(filter)
  );

  // Save edited bill + customer
  async function handleUpdate() {
    setLoading(true);
    const res = await fetch("/api/bills", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        billId: editingBill._id,
        updates: {
          items: editingBill.items,
          grandTotal: editingBill.grandTotal,
        },
        customerUpdates: {
          name: editingBill.customerId.name,
          type: editingBill.customerId.type,
          city: editingBill.customerId.city,
          mobile: editingBill.customerId.mobile,
        },
      }),
    });
    setLoading(false);

    if (res.ok) {
      setEditingBill(null);
      fetchBills(1);
    } else {
      alert("Failed to update bill");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {!dashboardCustomer && (
        <>
          <h1 className="text-2xl font-bold text-black mb-4">View Bills</h1>

          <input
            type="text"
            placeholder="Search by name or mobile"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full p-2 mb-4 border rounded text-black"
          />

          {/* Bills list */}
          <div className="space-y-4">
            {filteredBills.map((bill) => (
              <div
                key={bill._id}
                className="p-4 bg-white rounded-xl shadow border"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p
                      className="text-lg font-semibold text-black cursor-pointer"
                      onClick={() => setDashboardCustomer(bill.customerId)}
                    >
                      {bill.customerId?.name} ({bill.customerId?.mobile})
                    </p>
                    <p className="text-sm text-gray-500">
                      Bill No: {bill.billNo}
                    </p>
                    <p className="text-sm text-gray-500">
                      Total: ₹{bill.grandTotal}
                    </p>
                  </div>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:opacity-90"
                    onClick={() => setEditingBill(bill)}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Customer Dashboard */}
      {dashboardCustomer && (
        <div>
          <button
            className="mb-4 px-4 py-2 bg-gray-500 text-white rounded"
            onClick={() => setDashboardCustomer(null)}
          >
            Back
          </button>
          <h2 className="text-xl font-bold text-black mb-2">
            {dashboardCustomer.name} ({dashboardCustomer.mobile})
          </h2>
          <p className="text-gray-500">{dashboardCustomer.city} | {dashboardCustomer.type}</p>

          <div className="space-y-4 mt-4">
            {bills
              .filter((b) => b.customerId._id === dashboardCustomer._id)
              .map((bill) => (
                <div key={bill._id} className="p-4 bg-white rounded shadow">
                  <p>Bill No: {bill.billNo}</p>
                  <p>Total: ₹{bill.grandTotal}</p>
                  <button
                    className="mt-2 px-3 py-1 bg-blue-500 text-white rounded"
                    onClick={() => setEditingBill(bill)}
                  >
                    Edit
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4 text-black">Edit Bill</h2>

            {/* Customer Info */}
            <input
              type="text"
              value={editingBill.customerId.name}
              onChange={(e) =>
                setEditingBill({
                  ...editingBill,
                  customerId: { ...editingBill.customerId, name: e.target.value },
                })
              }
              className="w-full p-2 mb-2 border rounded text-black"
              placeholder="Customer Name"
            />
            <input
              type="text"
              value={editingBill.customerId.mobile}
              onChange={(e) =>
                setEditingBill({
                  ...editingBill,
                  customerId: {
                    ...editingBill.customerId,
                    mobile: e.target.value,
                  },
                })
              }
              className="w-full p-2 mb-2 border rounded text-black"
              placeholder="Mobile"
            />
            <input
              type="text"
              value={editingBill.customerId.city}
              onChange={(e) =>
                setEditingBill({
                  ...editingBill,
                  customerId: { ...editingBill.customerId, city: e.target.value },
                })
              }
              className="w-full p-2 mb-2 border rounded text-black"
              placeholder="City"
            />
            <input
              type="text"
              value={editingBill.customerId.type}
              onChange={(e) =>
                setEditingBill({
                  ...editingBill,
                  customerId: { ...editingBill.customerId, type: e.target.value },
                })
              }
              className="w-full p-2 mb-4 border rounded text-black"
              placeholder="Type"
            />

            {/* Bill Items */}
            {editingBill.items.map((item: any, idx: number) => (
              <div key={idx} className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => {
                    const newItems = [...editingBill.items];
                    newItems[idx].name = e.target.value;
                    setEditingBill({ ...editingBill, items: newItems });
                  }}
                  className="flex-1 p-2 border rounded text-black"
                />
                <input
                  type="number"
                  value={item.qty}
                  onChange={(e) => {
                    const newItems = [...editingBill.items];
                    newItems[idx].qty = Number(e.target.value);
                    newItems[idx].total = newItems[idx].qty * newItems[idx].rate;
                    const grandTotal = newItems.reduce((sum, i) => sum + i.total, 0);
                    setEditingBill({ ...editingBill, items: newItems, grandTotal });
                  }}
                  className="w-20 p-2 border rounded text-black"
                />
                <input
                  type="number"
                  value={item.rate}
                  onChange={(e) => {
                    const newItems = [...editingBill.items];
                    newItems[idx].rate = Number(e.target.value);
                    newItems[idx].total = newItems[idx].qty * newItems[idx].rate;
                    const grandTotal = newItems.reduce((sum, i) => sum + i.total, 0);
                    setEditingBill({ ...editingBill, items: newItems, grandTotal });
                  }}
                  className="w-20 p-2 border rounded text-black"
                />
              </div>
            ))}

            <p className="mt-2 font-semibold text-black">
              Grand Total: ₹{editingBill.grandTotal}
            </p>

            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => setEditingBill(null)}
                className="px-4 py-2 bg-gray-400 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded hover:opacity-90"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
