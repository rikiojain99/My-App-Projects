"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Vendor from "@/models/Vendor";
import VendorSale from "@/models/VendorSale";
import { getVendorOutstanding } from "@/lib/vendorBalance";

export type VendorBillingItemInput = {
  name: string;
  qty: number;
  rate: number;
  total?: number;
};

export type VendorBillingPayload = {
  vendorId?: string | null;
  shopName: string;
  city: string;
  mobile: string;
  deliveredBy: string;
  items: VendorBillingItemInput[];
  total: number;
  discount: number;
  paymentType: "paid" | "credit";
  paymentMethod: "cash" | "upi" | "split" | null;
  cashAmount: number;
  upiAmount: number;
};

export type VendorBillingResult = {
  ok: true;
  saleId: string;
  vendorId: string;
  vendorName: string;
  oldBalance: number;
  newBalance: number;
  finalTotal: number;
  whatsappPayload: {
    mobile: string;
    vendorName: string;
    items: Array<{
      name: string;
      qty: number;
      amount: number;
    }>;
    total: number;
    paymentLabel: "Credit" | "Paid";
    oldBalance: number;
    newBalance: number;
  };
};

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const isSameAmount = (a: number, b: number) =>
  Math.abs(roundMoney(a) - roundMoney(b)) < 0.01;

const isTransactionUnsupported = (err: unknown) => {
  const message = String((err as any)?.message || "");
  return (
    message.includes("Transaction numbers are only allowed") ||
    message.includes("replica set member or mongos")
  );
};

const normalizeItems = (items: VendorBillingItemInput[]) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Add at least one item");
  }

  const normalizedItems = items.map((item, index) => {
    const name = String(item?.name || "").trim();
    const qty = Number(item?.qty || 0);
    const rate = Number(item?.rate || 0);

    if (!name) {
      throw new Error(`Item name is required at row ${index + 1}`);
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error(`Valid qty is required for ${name}`);
    }
    if (!Number.isFinite(rate) || rate < 0) {
      throw new Error(`Valid rate is required for ${name}`);
    }

    return {
      name,
      qty,
      rate,
      total: roundMoney(qty * rate),
    };
  });

  const total = roundMoney(
    normalizedItems.reduce((sum, item) => sum + item.total, 0)
  );

  if (total <= 0) {
    throw new Error("Bill total must be greater than 0");
  }

  return { normalizedItems, total };
};

const normalizePayment = ({
  paymentType,
  paymentMethod,
  finalTotal,
  cashAmount,
  upiAmount,
}: {
  paymentType: VendorBillingPayload["paymentType"];
  paymentMethod: VendorBillingPayload["paymentMethod"];
  finalTotal: number;
  cashAmount: number;
  upiAmount: number;
}) => {
  if (paymentType === "credit") {
    return {
      paymentType: "credit" as const,
      paymentMethod: null,
      cashAmount: 0,
      upiAmount: 0,
      creditAmount: finalTotal,
      isPaid: false,
    };
  }

  if (!paymentMethod || !["cash", "upi", "split"].includes(paymentMethod)) {
    throw new Error("Select a payment method");
  }

  const normalizedCash = roundMoney(Number(cashAmount || 0));
  const normalizedUpi = roundMoney(Number(upiAmount || 0));

  if (paymentMethod === "cash") {
    if (!isSameAmount(normalizedCash, finalTotal) || normalizedUpi !== 0) {
      throw new Error("Cash amount must match the final total");
    }
  }

  if (paymentMethod === "upi") {
    if (!isSameAmount(normalizedUpi, finalTotal) || normalizedCash !== 0) {
      throw new Error("UPI amount must match the final total");
    }
  }

  if (paymentMethod === "split") {
    if (!isSameAmount(normalizedCash + normalizedUpi, finalTotal)) {
      throw new Error("Split payment must match the final total");
    }
    if (normalizedCash <= 0 || normalizedUpi <= 0) {
      throw new Error("Enter both cash and UPI amounts for split payment");
    }
  }

  return {
    paymentType: "paid" as const,
    paymentMethod,
    cashAmount: normalizedCash,
    upiAmount: normalizedUpi,
    creditAmount: 0,
    isPaid: true,
  };
};

async function resolveVendor(
  payload: VendorBillingPayload,
  session?: mongoose.ClientSession
) {
  const normalizedVendorId = String(payload.vendorId || "").trim();
  const normalizedShopName = String(payload.shopName || "").trim();
  const normalizedCity = String(payload.city || "").trim();
  const normalizedMobile = String(payload.mobile || "").trim();

  if (!normalizedShopName) {
    throw new Error("Vendor name is required");
  }

  if (!/^\d{10}$/.test(normalizedMobile)) {
    throw new Error("Enter a valid 10-digit mobile number");
  }

  let vendor = null;

  if (normalizedVendorId) {
    const query = Vendor.findById(normalizedVendorId);
    if (session) query.session(session);
    vendor = await query;
  }

  if (!vendor) {
    const query = Vendor.findOne({ mobile: normalizedMobile });
    if (session) query.session(session);
    vendor = await query;
  }

  if (!vendor) {
    const query = Vendor.findOne({ name: normalizedShopName });
    if (session) query.session(session);
    vendor = await query;
  }

  if (!vendor) {
    const [createdVendor] = await Vendor.create(
      [
        {
          name: normalizedShopName,
          mobile: normalizedMobile,
          city: normalizedCity,
        },
      ],
      session ? { session } : undefined
    );
    return createdVendor;
  }

  vendor.name = normalizedShopName;
  vendor.mobile = normalizedMobile;
  vendor.city = normalizedCity;
  await vendor.save(session ? { session } : undefined);
  return vendor;
}

async function persistVendorBilling(
  payload: VendorBillingPayload,
  session?: mongoose.ClientSession
) {
  const { normalizedItems, total } = normalizeItems(payload.items);
  const safeDiscount = Math.max(roundMoney(Number(payload.discount || 0)), 0);
  const finalTotal = Math.max(roundMoney(total - safeDiscount), 0);

  if (
    payload.total !== undefined &&
    !isSameAmount(Number(payload.total || 0), total)
  ) {
    throw new Error("Bill total changed. Please review items once.");
  }

  const payment = normalizePayment({
    paymentType: payload.paymentType,
    paymentMethod: payload.paymentMethod,
    finalTotal,
    cashAmount: payload.cashAmount,
    upiAmount: payload.upiAmount,
  });

  const vendor = await resolveVendor(payload, session);
  const oldBalance = await getVendorOutstanding(vendor._id);
  const newBalance = roundMoney(oldBalance + payment.creditAmount);

  const [sale] = await VendorSale.create(
    [
      {
        vendorId: vendor._id,
        items: normalizedItems,
        deliveryPerson: String(payload.deliveredBy || "").trim(),
        deliveredBy: String(payload.deliveredBy || "").trim(),
        grandTotal: total,
        discount: safeDiscount,
        finalTotal,
        paymentType: payment.paymentType,
        paymentMethod: payment.paymentMethod,
        oldBalance,
        newBalance,
        cashAmount: payment.cashAmount,
        upiAmount: payment.upiAmount,
        cashPaid: payment.cashAmount,
        creditAmount: payment.creditAmount,
        isPaid: payment.isPaid,
      },
    ],
    session ? { session } : undefined
  );

  await Vendor.findByIdAndUpdate(
    vendor._id,
    {
      $set: {
        name: vendor.name,
        mobile: vendor.mobile,
        city: vendor.city || "",
        balance: newBalance,
      },
      $inc: {
        totalCredit: payment.creditAmount,
      },
    },
    session ? { session } : undefined
  );

  revalidatePath("/billing");
  revalidatePath("/vendors/sale");
  revalidatePath("/vendors/ledger");

  return {
    ok: true as const,
    saleId: String(sale._id),
    vendorId: String(vendor._id),
    vendorName: vendor.name,
    oldBalance,
    newBalance,
    finalTotal,
    whatsappPayload: {
      mobile: vendor.mobile,
      vendorName: vendor.name,
      items: normalizedItems.map((item) => ({
        name: item.name,
        qty: item.qty,
        amount: item.total,
      })),
      total: finalTotal,
      paymentLabel: (
        payment.paymentType === "credit" ? "Credit" : "Paid"
      ) as "Credit" | "Paid",
      oldBalance,
      newBalance,
    },
  };
}

export async function createVendorBilling(
  payload: VendorBillingPayload
): Promise<VendorBillingResult> {
  await dbConnect();

  const session = await mongoose.startSession();

  try {
    let result: VendorBillingResult | null = null;

    await session.withTransaction(async () => {
      result = await persistVendorBilling(payload, session);
    });

    if (!result) {
      throw new Error("Unable to save vendor bill");
    }

    return result;
  } catch (err) {
    if (isTransactionUnsupported(err)) {
      return persistVendorBilling(payload);
    }

    const message = String((err as any)?.message || "Something went wrong");
    throw new Error(message);
  } finally {
    await session.endSession();
  }
}
