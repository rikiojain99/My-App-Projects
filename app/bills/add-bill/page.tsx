"use client";
import {
  useState,
  useMemo,
  useRef,
  useEffect,
  forwardRef,
} from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

/* ---------------- TYPES ---------------- */
type Customer = {
  name: string;
  type: string;
  city: string;
  mobile: string;
};

type Item = {
  name: string;
  qty: number;
  rate: number;
  total: number;
  availableQty?: number; // ✅ step 2
  error?: string;        // ✅ step 2
};

type ItemType = {
  _id: string;
  name: string;
};

export default function AddBill() {
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    type: "",
    city: "",
    mobile: "",
  });

  const [items, setItems] = useState<Item[]>([
    { name: "", qty: 1, rate: 0, total: 0 },
  ]);

  const [message, setMessage] = useState("");
  const [billNo] = useState(`BILL-${Date.now()}`);
  const grandTotal = useMemo(
    () => items.reduce((sum, i) => sum + i.total, 0),
    [items]
  );

  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({
    1: true,
    2: true,
  });

  const itemRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ---------------- CUSTOMER ---------------- */
  const handleCustomerChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setCustomer({ ...customer, [name]: value });

    if (name === "mobile" && value.length === 10) {
      const res = await fetch(`/api/customers?mobile=${value}`);
      if (res.ok) {
        const existing = await res.json();
        if (existing) setCustomer(existing);
      }
    }
  };

  const toggle = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  /* ---------------- ITEMS ---------------- */
  const handleItemChange = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const newItems = [...items];

    if (name === "name") {
      newItems[index].name = value;

      // ✅ Step 2: read stock
      if (value) {
        const res = await fetch(`/api/item-stock?name=${value}`);
        if (res.ok) {
          const data = await res.json();
          newItems[index].availableQty = data.availableQty;
        }
      }
    }

    if (name === "qty") {
      newItems[index].qty = Number(value);

      if (
        newItems[index].availableQty !== undefined &&
        newItems[index].qty > newItems[index].availableQty
      ) {
        newItems[index].error = `Only ${newItems[index].availableQty} available`;
      } else {
        newItems[index].error = "";
      }
    }

    if (name === "rate") {
      newItems[index].rate = Number(value);
    }

    newItems[index].total =
      newItems[index].qty * newItems[index].rate;

    setItems(newItems);
  };

  const addItem = () => {
    const newItems = [
      ...items,
      { name: "", qty: 1, rate: 0, total: 0 },
    ];
    setItems(newItems);

    setTimeout(() => {
      itemRefs.current[newItems.length - 1]?.focus();
    }, 0);
  };

  const removeItem = (index: number) =>
    setItems(items.filter((_, i) => i !== index));

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (items.some((i) => i.error)) {
      setMessage("❌ Quantity exceeds available stock");
      return;
    }

    await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customer),
    });

    const billRes = await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mobile: customer.mobile,
        items,
        grandTotal,
        billNo,
      }),
    });

    if (!billRes.ok) {
      setMessage("❌ Failed to save bill");
      return;
    }

    setMessage("✅ Bill saved successfully!");
    setCustomer({ name: "", type: "", city: "", mobile: "" });
    setItems([{ name: "", qty: 1, rate: 0, total: 0 }]);
  };

  /* ---------------- UI (UNCHANGED) ---------------- */
  return (
    <ProtectedRoute>
      <form
        onSubmit={handleSubmit}
        className="p-2 md:p-10 m-4 md:m-10 max-w-full bg-white text-black border rounded-lg"
      >
        <h1 className="text-xl font-bold m-1">Add Bill</h1>
        {message && <p className="mb-4 text-red-600">{message}</p>}

        {/* CUSTOMER */}
        <div className="rounded p-2 mb-4">
          <div className="flex justify-between items-center shadow-2xl mb-2 border-b-2">
            <h2 className="text-lg font-semibold">Customer Details</h2>
            <button type="button" onClick={() => toggle(1)}>
              {expanded[1] ? "−" : "+"}
            </button>
          </div>

          {expanded[1] && (
            <div className="mt-2 space-y-2">
              <input name="name" value={customer.name} onChange={handleCustomerChange} placeholder="Customer Name" className="w-full p-2 border rounded" />
              <input name="type" value={customer.type} onChange={handleCustomerChange} placeholder="Type" className="w-full p-2 border rounded" />
              <input name="city" value={customer.city} onChange={handleCustomerChange} placeholder="City" className="w-full p-2 border rounded" />
              <input name="mobile" value={customer.mobile} onChange={handleCustomerChange} placeholder="Mobile number" className="w-full p-2 border rounded" />
            </div>
          )}
        </div>

        {/* ITEMS */}
        <div className="rounded p-2 mb-4 border">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Items</h2>
            <button type="button" onClick={() => toggle(2)}>
              {expanded[2] ? "−" : "+"}
            </button>
          </div>

          {expanded[2] && (
            <>
              <div className="grid grid-cols-5 font-semibold">
                <span>Item</span>
                <span className="text-center">Qty</span>
                <span className="text-center">Rate</span>
                <span className="text-center">Total</span>
                <span></span>
              </div>

              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-5">
                  <ItemNameInput
                    ref={(el) => {
                      // ✅ FIXED ref (no return)
                      itemRefs.current[index] = el;
                    }}
                    index={index}
                    items={items}
                    handleItemChange={handleItemChange}
                  />

                  <input name="qty" value={item.qty} onChange={(e) => handleItemChange(index, e)} className="border text-center" />
                  <input name="rate" value={item.rate} onChange={(e) => handleItemChange(index, e)} className="border text-center" />

                  <div className="text-center border">
                    {item.total}
                    {item.availableQty !== undefined && (
                      <div className="text-xs text-gray-500">
                        Avl: {item.availableQty}
                      </div>
                    )}
                    {item.error && (
                      <div className="text-xs text-red-500">
                        {item.error}
                      </div>
                    )}
                  </div>

                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)}>✕</button>
                  )}
                </div>
              ))}

              <button type="button" onClick={addItem} className="mt-2 px-3 py-1 bg-green-500 text-white rounded">
                + Add Item
              </button>
            </>
          )}
        </div>

        <div className="flex justify-between mt-4 font-bold">
          <span>Grand Total</span>
          <span>{grandTotal}</span>
        </div>

        <button type="submit" className="w-full py-2 mt-4 bg-blue-500 text-white rounded">
          Save Bill
        </button>
      </form>
    </ProtectedRoute>
  );
}

/* ---------------- ITEM NAME INPUT (UNCHANGED LOGIC) ---------------- */
const ItemNameInput = forwardRef<
  HTMLInputElement,
  {
    index: number;
    items: Item[];
    handleItemChange: (
      index: number,
      e: React.ChangeEvent<HTMLInputElement>
    ) => void;
  }
>(({ index, items, handleItemChange }, ref) => {
  const [query, setQuery] = useState(items[index].name);
  const [suggestions, setSuggestions] = useState<ItemType[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
  if (query.length < 3) {
    setSuggestions([]);
    return; // 👈 allowed ONLY because we also return void at bottom
  }

  if (debounceRef.current) {
    clearTimeout(debounceRef.current);
  }

  debounceRef.current = setTimeout(async () => {
    const res = await fetch(`/api/items?search=${query}`);
    if (res.ok) {
      setSuggestions(await res.json());
    }
  }, 300);

  // ✅ ALWAYS return a cleanup function (or nothing)
  return () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  };
}, [query]);

  return (
    <div className="relative text-black">
      <input
        ref={ref}
        name="name"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          handleItemChange(index, e);
        }}
        className="border p-2 w-full"
      />

      {suggestions.length > 0 && (
        <ul className="absolute z-10 bg-white border w-full">
          {suggestions.map((i) => (
            <li
              key={i._id}
              onMouseDown={(e) => {
                e.preventDefault();
                setQuery(i.name);
                handleItemChange(index, {
                  target: { name: "name", value: i.name },
                } as any);
                setSuggestions([]);
              }}
              className="px-2 py-1 hover:bg-blue-100 cursor-pointer"
            >
              {i.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
