"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import CreditVendorList from "@/components/CreditVendorList";
import CreditDetail from "@/components/CreditDetail";
import PaymentForm from "@/components/PaymentForm";
import SaveStatusPopup, {
  type SavePopupStatus,
} from "@/components/ui/SaveStatusPopup";
import {
  getCreditVendorDetail,
  getCreditVendors,
  recordCreditPayment,
  type CreditVendorDetail,
  type CreditVendorSummary,
} from "@/actions/credit";
import { openVendorCreditWhatsApp } from "@/lib/whatsapp";

export default function CreditPage() {
  const [search, setSearch] = useState("");
  const [vendors, setVendors] = useState<CreditVendorSummary[]>([]);
  const [selectedVendor, setSelectedVendor] =
    useState<CreditVendorDetail | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isListLoading, setIsListLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
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

  const vendorsCacheRef = useRef<Record<string, CreditVendorSummary[]>>({});

  const normalizedSearch = useMemo(() => search.trim(), [search]);

  useEffect(() => {
    let ignore = false;

    const timer = setTimeout(async () => {
      const cacheKey = normalizedSearch.toLowerCase();

      if (vendorsCacheRef.current[cacheKey]) {
        setVendors(vendorsCacheRef.current[cacheKey]);
        setIsListLoading(false);
        return;
      }

      setIsListLoading(true);

      try {
        const result = await getCreditVendors({
          search: normalizedSearch,
          limit: 20,
        });

        if (ignore) return;

        vendorsCacheRef.current[cacheKey] = result;
        setVendors(result);
      } catch {
        if (!ignore) {
          setVendors([]);
        }
      } finally {
        if (!ignore) {
          setIsListLoading(false);
        }
      }
    }, 300);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [normalizedSearch]);

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

  const handleSelectVendor = async (vendor: CreditVendorSummary) => {
    setIsDetailLoading(true);

    try {
      const detail = await getCreditVendorDetail(vendor._id);
      setSelectedVendor(detail);
      setPaymentAmount("");
    } catch (error) {
      showPopup(
        "error",
        "Unable to load vendor",
        String((error as Error)?.message || "Something went wrong.")
      );
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleQuickAdd = (value: number) => {
    const currentAmount = Number(paymentAmount || 0);
    setPaymentAmount(String(currentAmount + value));
  };

  const handleSavePayment = async (mode: "save" | "whatsapp") => {
    if (!selectedVendor) return;

    const paidAmount = Number(paymentAmount || 0);

    if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
      showPopup("error", "Invalid amount", "Enter a valid payment amount.");
      return;
    }

    if (paidAmount > selectedVendor.vendor.balance) {
      showPopup(
        "error",
        "Overpayment blocked",
        "Payment amount cannot exceed current balance."
      );
      return;
    }

    const confirmMessage =
      mode === "whatsapp"
        ? "Save this payment and open WhatsApp?"
        : "Save this payment?";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    showPopup(
      "saving",
      "Saving payment",
      "Please wait while we save the payment."
    );

    try {
      setIsSaving(true);
      const result = await recordCreditPayment({
        vendorId: selectedVendor.vendor._id,
        amount: paidAmount,
        sendWhatsapp: mode === "whatsapp",
      });

      const updatedDetail = await getCreditVendorDetail(selectedVendor.vendor._id);
      setSelectedVendor(updatedDetail);
      setPaymentAmount("");

      setVendors((current) =>
        current
          .map((vendor) =>
            vendor._id === selectedVendor.vendor._id
              ? { ...vendor, balance: result.newBalance }
              : vendor
          )
          .filter((vendor) => vendor.balance > 0)
          .sort((a, b) => b.balance - a.balance)
      );
      vendorsCacheRef.current = {};

      if (mode === "whatsapp") {
        openVendorCreditWhatsApp(result.whatsappPayload);
      }

      showPopup(
        "success",
        "Payment saved",
        mode === "whatsapp"
          ? "Payment saved and WhatsApp opened."
          : "Payment saved successfully."
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
      <div className="max-w-5xl mx-auto bg-white border rounded-xl p-4 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-black">Credit Management</h1>
        </div>

        {!selectedVendor ? (
          <CreditVendorList
            vendors={vendors}
            search={search}
            isLoading={isListLoading}
            onSearchChange={setSearch}
            onSelectVendor={handleSelectVendor}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.9fr)] lg:items-start">
            <CreditDetail
              detail={selectedVendor}
              isLoading={isDetailLoading}
              onBack={() => {
                setSelectedVendor(null);
                setPaymentAmount("");
              }}
            />

            <div className="lg:sticky lg:top-20">
              <PaymentForm
                previousBalance={selectedVendor.vendor.balance}
                amount={paymentAmount}
                isSaving={isSaving}
                onAmountChange={setPaymentAmount}
                onQuickAdd={handleQuickAdd}
                onSave={handleSavePayment}
              />
            </div>
          </div>
        )}

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
