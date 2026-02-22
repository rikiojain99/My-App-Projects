import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import VendorSale from "@/models/VendorSale";
import VendorPayment from "@/models/VendorPayment";

export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendorId");

  if (!vendorId) {
    return NextResponse.json(
      { error: "Vendor required" },
      { status: 400 }
    );
  }

  const sales = await VendorSale.find({
    vendorId,
  }).sort({ createdAt: -1 });

  const payments = await VendorPayment.find({
    vendorId,
  }).sort({ createdAt: -1 });

  const totalCredit = sales.reduce(
    (sum, s) => sum + (s.creditAmount || 0),
    0
  );

  const totalPayments = payments.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );

  const outstanding =
    totalCredit - totalPayments;

  return NextResponse.json({
    sales,
    payments,
    totalCredit,
    totalPayments,
    outstanding,
  });
}
