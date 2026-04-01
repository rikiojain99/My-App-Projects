"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import ItemsTable from "@/components/billing/ItemsTable";
import PaymentModal from "@/components/PaymentModal";
import VendorForm, {
  type VendorFormValue,
} from "@/components/VendorForm";
import SaveStatusPopup, {
  type SavePopupStatus,
} from "@/components/ui/SaveStatusPopup";
import {
  createVendorBilling,
  type VendorBillingPayload,
} from "@/actions/billing";
import { openVendorBillingWhatsApp } from "@/lib/whatsapp";

type VendorSearchResult = {
  _id: string;
  name: string;
  city?: string;
  mobile: string;
  balance?: number;
};

const RECENT_VENDORS_KEY = "billing-recent-vendors";

function readRecentVendors(): VendorSearchResult[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(RECENT_VENDORS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch {
    return [];
  }
}

function writeRecentVendors(vendor: VendorSearchResult) {
  if (typeof window === "undefined") return;

  try {
    const existing = readRecentVendors().filter(
      (item) => item._id !== vendor._id
    );
    window.localStorage.setItem(
      RECENT_VENDORS_KEY,
      JSON.stringify([vendor, ...existing].slice(0, 6))
    );
  } catch {}
}

type BillingItem = {
  name: string;
  qty: number;
  rate: number;
  total: number;
};

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const parseIntegerInput = (value: string) => {
  const digitsOnly = value.replace(/\D/g, "");
  return digitsOnly === "" ? 0 : Number(digitsOnly);
};

const parseMoneyInput = (value: string) => {
  const normalized = value.replace(/[^0-9.]/g, "");
  const [whole = "", ...rest] = normalized.split(".");
  const merged = rest.length > 0 ? `${whole}.${rest.join("")}` : whole;
  return merged === "" ? 0 : roundMoney(Number(merged));
};

const isSameAmount = (a: number, b: number) =>
  Math.abs(roundMoney(a) - roundMoney(b)) < 0.01;

const createBlankItem = (): BillingItem => ({
  name: "",
  qty: 1,
  rate: 0,
  total: 0,
});

const createEmptyVendor = (): VendorFormValue => ({
  vendorId: null,
  shopName: "",
  city: "",
  mobile: "",
  deliveredBy: "",
  oldBalance: 0,
  isExisting: false,
});

const cacheRecentVendor = ({
  vendorId,
  vendorName,
  mobile,
  city,
  balance,
}: {
  vendorId: string;
  vendorName: string;
  mobile: string;
  city: string;
  balance: number;
}) => {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(RECENT_VENDORS_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const safeExisting = Array.isArray(existing) ? existing : [];
    const nextItem = {
      _id: vendorId,
      name: vendorName,
      mobile,
      city,
      balance,
    };

    const merged = [nextItem, ...safeExisting].filter(
      (vendor, index, array) =>
        vendor?._id &&
        array.findIndex((entry) => entry._id === vendor._id) === index
    );

    window.localStorage.setItem(
      RECENT_VENDORS_KEY,
      JSON.stringify(merged.slice(0, 6))
    );
  } catch {}
};

export default function BillingPage() {
  const [vendor, setVendor] = useState<VendorFormValue>(createEmptyVendor);
  const [items, setItems] = useState<BillingItem[]>([createBlankItem()]);
  const [expanded, setExpanded] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);

  const [discount, setDiscount] = useState(0);
  const [paymentType, setPaymentType] = useState<"paid" | "credit">(
    "paid"
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "upi" | "split"
  >("cash");
  const [cashAmount, setCashAmount] = useState(0);
  const [upiAmount, setUpiAmount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [popup, setPopup] = useState<{
    open: boolean;
    status: SavePopupStatus;
    title: string;
    message: string;
  }>({
    open: false,
    status: "saving",
    title: "",
    message: "",
  });

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<VendorSearchResult[]>([]);
  const [recentVendors, setRecentVendors] = useState<VendorSearchResult[]>([]);
  const deferredQuery = useDeferredValue(query.trim());

  const qtyRefs = useRef<(HTMLInputElement | null)[]>([]);
  const itemRefs = useRef<(HTMLInputElement | null)[]>([]);
  const itemsContainerRef = useRef<HTMLDivElement | null>(null);

  const grandTotal = useMemo(
    () =>
      roundMoney(
        items.reduce((sum, item) => {
          return sum + Number(item.total || 0);
        }, 0)
      ),
    [items]
  );

  useEffect(() => {
    if (discount > grandTotal) {
      setDiscount(grandTotal);
    }
  }, [discount, grandTotal]);

  const finalTotal = useMemo(
    () => Math.max(roundMoney(grandTotal - discount), 0),
    [grandTotal, discount]
  );

  useEffect(() => {
    if (paymentType === "credit") {
      if (cashAmount !== 0) setCashAmount(0);
      if (upiAmount !== 0) setUpiAmount(0);
      return;
    }

    if (paymentMethod === "cash") {
      if (!isSameAmount(cashAmount, finalTotal)) {
        setCashAmount(finalTotal);
      }
      if (upiAmount !== 0) {
        setUpiAmount(0);
      }
      return;
    }

    if (paymentMethod === "upi") {
      if (cashAmount !== 0) {
        setCashAmount(0);
      }
      if (!isSameAmount(upiAmount, finalTotal)) {
        setUpiAmount(finalTotal);
      }
      return;
    }

    const normalizedCash = Math.min(
      Math.max(roundMoney(cashAmount || 0), 0),
      finalTotal
    );

    if (!isSameAmount(normalizedCash, cashAmount)) {
      setCashAmount(normalizedCash);
      return;
    }

    const nextUpi = roundMoney(finalTotal - normalizedCash);
    if (!isSameAmount(nextUpi, upiAmount)) {
      setUpiAmount(nextUpi);
    }
  }, [cashAmount, finalTotal, paymentMethod, paymentType, upiAmount]);

  useEffect(() => {
    searchInputRef.current?.focus();
    setRecentVendors(readRecentVendors());
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const normalizedQuery = deferredQuery;

    if (!isOpen && normalizedQuery.length === 0) {
      return () => controller.abort();
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);

      try {
        const endpoint =
          normalizedQuery.length > 0
            ? `/api/vendors?search=${encodeURIComponent(normalizedQuery)}&limit=8`
            : "/api/vendors?recent=1&limit=6";

        const response = await fetch(endpoint, {
          signal: controller.signal,
        });

        if (!response.ok) {
          setResults([]);
          return;
        }

        const data = await response.json();

        if (normalizedQuery.length > 0) {
          setResults(Array.isArray(data) ? data : []);
        } else {
          const serverRecent = Array.isArray(data) ? data : [];
          const cached = readRecentVendors();
          const merged = [...cached, ...serverRecent].reduce<
            VendorSearchResult[]
          >((accumulator, vendor) => {
            if (!vendor?._id) return accumulator;
            if (
              accumulator.some((item) => item._id === vendor._id)
            ) {
              return accumulator;
            }
            accumulator.push(vendor);
            return accumulator;
          }, []);

          setRecentVendors(merged.slice(0, 6));
        }
      } catch {
        if (normalizedQuery.length > 0) {
          setResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [deferredQuery, isOpen]);

  const dropdownItems = useMemo(
    () => (query.trim().length > 0 ? results : recentVendors),
    [query, recentVendors, results]
  );

  const handleSelectVendor = (vendor: VendorSearchResult) => {
    setQuery(vendor.name);
    setIsOpen(false);
    writeRecentVendors(vendor);
    setRecentVendors(readRecentVendors());
    handleVendorChange({
      vendorId: vendor._id,
      shopName: vendor.name,
      city: vendor.city || "",
      mobile: vendor.mobile || "",
      oldBalance: Number(vendor.balance || 0),
      isExisting: true,
    });
  };

  const showCreateHint =
    !isLoading &&
    query.trim().length > 0 &&
    results.length === 0;

  const showPopup = (
    status: SavePopupStatus,
    title: string,
    message: string
  ) => {
    setPopup({
      open: true,
      status,
      title,
      message,
    });
  };

  const handleVendorChange = (patch: Partial<VendorFormValue>) => {
    setVendor((current) => ({ ...current, ...patch }));
  };

  const handleItemChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    setItems((current) => {
      const nextItems = [...current];
      const nextItem = { ...nextItems[index] };

      if (name === "name") {
        nextItem.name = value;
      }

      if (name === "qty") {
        nextItem.qty = parseIntegerInput(value);
      }

      if (name === "rate") {
        nextItem.rate = parseMoneyInput(value);
      }

      if (name === "total") {
        nextItem.total = parseMoneyInput(value);
      }

      if (name === "total") {
        nextItem.rate =
          nextItem.qty > 0
            ? roundMoney(nextItem.total / nextItem.qty)
            : 0;
      } else {
        nextItem.total = roundMoney(nextItem.qty * nextItem.rate);
      }

      nextItems[index] = nextItem;
      return nextItems;
    });
  };

  const addItem = () => {
    const nextIndex = items.length;
    setItems((current) => [...current, createBlankItem()]);

    setTimeout(() => {
      qtyRefs.current[nextIndex]?.focus();
    }, 0);
  };

  const removeItem = (index: number) => {
    setItems((current) => {
      if (current.length === 1) return current;
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const getFocusableItemInputs = () => {
    const container = itemsContainerRef.current;
    if (!container) return [];

    return Array.from(
      container.querySelectorAll<HTMLInputElement>(
        "input[name='qty'], input[name='name'], input[name='rate'], input[name='total']"
      )
    );
  };

  const handleItemsKeyDownCapture = (
    event: React.KeyboardEvent<HTMLDivElement>
  ) => {
    const target = event.target;

    if (!(target instanceof HTMLInputElement) || event.key !== "Enter") {
      return;
    }

    if (!["qty", "name", "rate", "total"].includes(target.name)) {
      return;
    }

    event.preventDefault();

    const focusableInputs = getFocusableItemInputs();
    const currentIndex = focusableInputs.findIndex(
      (input) => input === target
    );

    if (currentIndex === -1) return;

    const isLastInput = currentIndex === focusableInputs.length - 1;
    if (isLastInput) {
      addItem();
      return;
    }

    focusableInputs[currentIndex + 1]?.focus();
  };

  const getValidatedItems = () => {
    const normalizedItems = items.map((item) => ({
      name: String(item.name || "").trim(),
      qty: Number(item.qty || 0),
      rate: Number(item.rate || 0),
      total: roundMoney(Number(item.qty || 0) * Number(item.rate || 0)),
    }));

    const validItems = normalizedItems.filter(
      (item) =>
        item.name.length > 0 &&
        Number.isFinite(item.qty) &&
        item.qty > 0 &&
        Number.isFinite(item.rate) &&
        item.rate >= 0
    );

    const hasInvalidRows = normalizedItems.some((item) => {
      const hasAnyValue =
        item.name.length > 0 || item.qty > 0 || item.rate > 0;

      if (!hasAnyValue) return false;

      return (
        item.name.length === 0 ||
        !Number.isFinite(item.qty) ||
        item.qty <= 0 ||
        !Number.isFinite(item.rate) ||
        item.rate < 0
      );
    });

    return { validItems, hasInvalidRows };
  };

  const validateBeforePayment = () => {
    const { validItems, hasInvalidRows } = getValidatedItems();

    if (!vendor.shopName.trim()) {
      showPopup("error", "Vendor missing", "Enter vendor name.");
      return false;
    }

    if (!/^\d{10}$/.test(vendor.mobile.trim())) {
      showPopup(
        "error",
        "Mobile required",
        "Enter a valid 10-digit vendor mobile number."
      );
      return false;
    }

    if (validItems.length === 0) {
      showPopup("error", "Items missing", "Add at least one valid item.");
      return false;
    }

    if (hasInvalidRows) {
      showPopup(
        "error",
        "Fix item rows",
        "One or more item rows are incomplete."
      );
      return false;
    }

    if (grandTotal <= 0) {
      showPopup("error", "Invalid total", "Estimate total must be above zero.");
      return false;
    }

    return true;
  };

  const handleOpenPayment = () => {
    if (!validateBeforePayment()) return;
    setShowPayment(true);
  };

  const resetForm = () => {
    setVendor(createEmptyVendor());
    setItems([createBlankItem()]);
    setDiscount(0);
    setPaymentType("paid");
    setPaymentMethod("cash");
    setCashAmount(0);
    setUpiAmount(0);
    setShowPayment(false);
    setFormResetKey((current) => current + 1);
  };

  const handleSave = async (mode: "save" | "whatsapp") => {
    const { validItems, hasInvalidRows } = getValidatedItems();

    if (hasInvalidRows || validItems.length === 0) {
      showPopup(
        "error",
        "Items missing",
        "Please complete the item rows before saving."
      );
      return;
    }

    if (paymentType === "paid") {
      if (
        paymentMethod === "cash" &&
        !isSameAmount(cashAmount, finalTotal)
      ) {
        showPopup(
          "error",
          "Cash mismatch",
          "Cash amount should match the final total."
        );
        return;
      }

      if (
        paymentMethod === "upi" &&
        !isSameAmount(upiAmount, finalTotal)
      ) {
        showPopup(
          "error",
          "UPI mismatch",
          "UPI amount should match the final total."
        );
        return;
      }

      if (
        paymentMethod === "split" &&
        !isSameAmount(cashAmount + upiAmount, finalTotal)
      ) {
        showPopup(
          "error",
          "Split mismatch",
          "Cash and UPI amounts should add up to the final total."
        );
        return;
      }
    }

    const confirmMessage =
      mode === "whatsapp"
        ? "Save this vendor estimate and open WhatsApp?"
        : "Save this vendor estimate?";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    const payload: VendorBillingPayload = {
      vendorId: vendor.vendorId,
      shopName: vendor.shopName.trim(),
      city: vendor.city.trim(),
      mobile: vendor.mobile.trim(),
      deliveredBy: vendor.deliveredBy.trim(),
      items: validItems,
      total: grandTotal,
      discount,
      paymentType,
      paymentMethod: paymentType === "paid" ? paymentMethod : null,
      cashAmount: paymentType === "paid" ? cashAmount : 0,
      upiAmount: paymentType === "paid" ? upiAmount : 0,
    };

    showPopup(
      "saving",
      "Saving vendor estimate",
      "Please wait while we save the estimate."
    );

    try {
      setIsSaving(true);
      const result = await createVendorBilling(payload);

      cacheRecentVendor({
        vendorId: result.vendorId,
        vendorName: result.vendorName,
        mobile: result.whatsappPayload.mobile,
        city: vendor.city.trim(),
        balance: result.newBalance,
      });

      if (mode === "whatsapp") {
        openVendorBillingWhatsApp(result.whatsappPayload);
      }

      resetForm();

      showPopup(
        "success",
        "Vendor estimate saved",
        mode === "whatsapp"
          ? "Estimate saved and WhatsApp opened."
          : "Estimate saved successfully."
      );
    } catch (error) {
      showPopup(
        "error",
        "Save failed",
        String((error as Error)?.message || "Something went wrong.")
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto bg-white border rounded-xl p-2 pb-32 space-y-2">
        <h1 className="text-xl font-bold text-black">Vendor Estimate</h1>
        <div className="relative mt-1">
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            placeholder="Search Vendor Name / Mobile"
            onFocus={() => {
              if (blurTimer.current) clearTimeout(blurTimer.current);
              setIsOpen(true);
            }}
            onBlur={() => {
              blurTimer.current = setTimeout(() => setIsOpen(false), 120);
            }}
            onChange={(event) => {
              const nextValue = event.target.value;
              const digitsOnly = nextValue.replace(/\D/g, "").slice(0, 10);
              const isNumericQuery =
                nextValue.trim().length > 0 && /^\d+$/.test(nextValue.trim());

              setQuery(nextValue);
              setIsOpen(true);
              handleVendorChange({
                vendorId: null,
                isExisting: false,
                oldBalance: 0,
                city: "",
                shopName: isNumericQuery ? "" : nextValue.trim(),
                mobile: digitsOnly,
              });
            }}
            className="w-full border p-2"
          />

          {isOpen && (
            <div className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-30 border bg-white shadow-lg max-h-64 overflow-y-auto">
              {query.trim().length === 0}

              {isLoading ? (
                <div className="space-y-2 p-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-12 animate-pulse rounded bg-gray-100"
                    />
                  ))}
                </div>
              ) : dropdownItems.length > 0 ? (
                <div className="p-1">
                  {dropdownItems.map((vendor) => (
                    <button
                      key={vendor._id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelectVendor(vendor)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50"
                    >
                      <div className="min-w-0 flex gap-2">
                        <p className="truncate font-medium  text-black">
                          {vendor.name}
                        </p>
                        <p className="truncate font-medium  text-black">
                         | {vendor.city || "City not set"} | {vendor.mobile}
                        </p>
                      </div>
                      <div className="ml-3 shrink-0 text-xs font-medium text-amber-700">
                        Rs.{Number(vendor.balance || 0)}
                      </div>
                    </button>
                  ))}
                </div>
              ) : showCreateHint ? (
                <div className="p-3 text-sm text-gray-500">
                  Vendor not found. New vendor will be created on save.
                </div>
              ) : (
                <div className="p-3 text-sm text-gray-500">
                  Start typing to search vendors.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <VendorForm
            key={formResetKey}
            value={vendor}
            onChange={handleVendorChange}
          />

          <section
            ref={itemsContainerRef}
            onKeyDownCapture={handleItemsKeyDownCapture}
          >
            <ItemsTable
              items={items}
              expanded={expanded}
              toggle={() => setExpanded((current) => !current)}
              qtyRefs={qtyRefs}
              itemRefs={itemRefs}
              onItemChange={handleItemChange}
              onAddItem={addItem}
              onRemoveItem={removeItem}
            />
          </section>

          <div className="rounded-xl border bg-gray-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-black">Grand Total</span>
              <span className="text-lg font-bold text-black">
                Rs. {grandTotal}
              </span>
            </div>
            {/* <p className="text-xs text-gray-500">
              {items.length} item{items.length === 1 ? "" : "s"}
            </p> */}

            <button
              type="button"
              onClick={handleOpenPayment}
              disabled={grandTotal <= 0 || isSaving}
              className={`w-full rounded-xl py-3 font-bold transition ${
                grandTotal <= 0 || isSaving
                  ? "bg-gray-300 text-gray-500"
                  : "bg-blue-600 text-white"
              }`}
            >
              Next
            </button>
          </div>

        </div>

        <PaymentModal
          open={showPayment}
          vendorName={vendor.shopName || "Vendor"}
          deliveredBy={vendor.deliveredBy}
          total={grandTotal}
          discount={discount}
          finalTotal={finalTotal}
          oldBalance={vendor.oldBalance}
          paymentType={paymentType}
          paymentMethod={paymentMethod}
          cashAmount={cashAmount}
          upiAmount={upiAmount}
          isSaving={isSaving}
          onClose={() => setShowPayment(false)}
          onDiscountChange={(value) =>
            setDiscount(Math.max(roundMoney(value), 0))
          }
          onPaymentTypeChange={setPaymentType}
          onPaymentMethodChange={setPaymentMethod}
          onCashAmountChange={(value) =>
            setCashAmount(
              Math.max(
                0,
                Math.min(roundMoney(Number(value || 0)), finalTotal)
              )
            )
          }
          onSave={handleSave}
        />

        <SaveStatusPopup
          open={popup.open}
          status={popup.status}
          title={popup.title}
          message={popup.message}
          onClose={() =>
            setPopup((current) => ({ ...current, open: false }))
          }
        />
      </div>
    </ProtectedRoute>
  );
}
