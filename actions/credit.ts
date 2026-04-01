"use server";

import dbConnect from "@/lib/db";
import Vendor from "@/models/Vendor";
import VendorPayment from "@/models/VendorPayment";
import VendorSale from "@/models/VendorSale";
import {
  getVendorOutstanding,
  getVendorOutstandingMap,
} from "@/lib/vendorBalance";

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export type CreditVendorSummary = {
  _id: string;
  name: string;
  mobile: string;
  city: string;
  balance: number;
};

export type CreditTransaction = {
  _id: string;
  type: "credit" | "payment";
  amount: number;
  createdAt: string;
  note?: string;
};

export type CreditVendorDetail = {
  vendor: CreditVendorSummary;
  transactions: CreditTransaction[];
};

export type RecordCreditPaymentInput = {
  vendorId: string;
  amount: number;
  sendWhatsapp?: boolean;
};

export type RecordCreditPaymentResult = {
  ok: true;
  paymentId: string;
  previousBalance: number;
  newBalance: number;
  whatsappPayload: {
    mobile: string;
    vendorName: string;
    amount: number;
    previousBalance: number;
    newBalance: number;
  };
};

export async function getCreditVendors({
  search = "",
  limit = 20,
}: {
  search?: string;
  limit?: number;
} = {}): Promise<CreditVendorSummary[]> {
  await dbConnect();

  const safeLimit = Math.min(Math.max(Number(limit || 20), 1), 20);
  const normalizedSearch = String(search || "").trim();
  const query: Record<string, any> = {
    balance: { $gt: 0 },
  };

  if (normalizedSearch) {
    const regex = escapeRegex(normalizedSearch);
    query.$or = [
      { name: { $regex: regex, $options: "i" } },
      { mobile: { $regex: regex, $options: "i" } },
    ];
  }

  const vendors = await Vendor.find(query)
    .select("_id name mobile city balance")
    .sort({ balance: -1, updatedAt: -1 })
    .limit(safeLimit)
    .lean();

  const balanceMap = await getVendorOutstandingMap(
    vendors.map((vendor: any) => String(vendor._id))
  );

  return vendors
    .map((vendor: any) => ({
      _id: String(vendor._id),
      name: String(vendor.name || "").trim(),
      mobile: String(vendor.mobile || "").trim(),
      city: String(vendor.city || "").trim(),
      balance: roundMoney(
        balanceMap.get(String(vendor._id)) ?? Number(vendor.balance || 0)
      ),
    }))
    .filter((vendor) => vendor.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, safeLimit);
}

export async function getCreditVendorDetail(
  vendorId: string
): Promise<CreditVendorDetail> {
  await dbConnect();

  const normalizedVendorId = String(vendorId || "").trim();
  if (!normalizedVendorId) {
    throw new Error("Vendor required");
  }

  const vendor = (await Vendor.findById(normalizedVendorId)
    .select("_id name mobile city balance")
    .lean()) as any;

  if (!vendor) {
    throw new Error("Vendor not found");
  }

  const currentBalance = await getVendorOutstanding(normalizedVendorId);

  const [creditRows, paymentRows] = await Promise.all([
    VendorSale.find({
      vendorId: normalizedVendorId,
      creditAmount: { $gt: 0 },
    })
      .select("_id creditAmount createdAt newBalance")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    VendorPayment.find({
      vendorId: normalizedVendorId,
    })
      .select("_id amount note createdAt previousBalance newBalance")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const transactions: CreditTransaction[] = [
    ...creditRows.map((row: any) => ({
      _id: `credit-${String(row._id)}`,
      type: "credit" as const,
      amount: roundMoney(Number(row.creditAmount || 0)),
      createdAt: new Date(row.createdAt).toISOString(),
      note: "Credit added",
    })),
    ...paymentRows.map((row: any) => ({
      _id: `payment-${String(row._id)}`,
      type: "payment" as const,
      amount: roundMoney(Number(row.amount || 0)),
      createdAt: new Date(row.createdAt).toISOString(),
      note: String(row.note || "").trim() || "Payment received",
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  return {
    vendor: {
      _id: String(vendor._id),
      name: String(vendor.name || "").trim(),
      mobile: String(vendor.mobile || "").trim(),
      city: String(vendor.city || "").trim(),
      balance: currentBalance,
    },
    transactions,
  };
}

export async function recordCreditPayment({
  vendorId,
  amount,
  sendWhatsapp = false,
}: RecordCreditPaymentInput): Promise<RecordCreditPaymentResult> {
  await dbConnect();

  const normalizedVendorId = String(vendorId || "").trim();
  const paidAmount = roundMoney(Number(amount || 0));

  if (!normalizedVendorId) {
    throw new Error("Vendor required");
  }

  if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
    throw new Error("Enter a valid payment amount");
  }

  const vendor = (await Vendor.findById(normalizedVendorId)
    .select("_id name mobile")
    .lean()) as any;

  if (!vendor) {
    throw new Error("Vendor not found");
  }

  const previousBalance = await getVendorOutstanding(normalizedVendorId);

  if (previousBalance <= 0) {
    throw new Error("This vendor has no pending balance");
  }

  if (paidAmount > previousBalance) {
    throw new Error("Payment amount cannot exceed pending balance");
  }

  const newBalance = roundMoney(previousBalance - paidAmount);

  const payment = await VendorPayment.create({
    vendorId: normalizedVendorId,
    amount: paidAmount,
    previousBalance,
    newBalance,
    note: sendWhatsapp ? "Paid via Credit Management" : "Paid",
  });

  await Vendor.findByIdAndUpdate(normalizedVendorId, {
    $set: { balance: newBalance },
  });

  return {
    ok: true,
    paymentId: String(payment._id),
    previousBalance,
    newBalance,
    whatsappPayload: {
      mobile: String(vendor.mobile || "").trim(),
      vendorName: String(vendor.name || "").trim(),
      amount: paidAmount,
      previousBalance,
      newBalance,
    },
  };
}
