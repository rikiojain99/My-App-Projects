import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bill from "@/models/Bill";
import Customer from "@/models/Customer";

export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const mobile = searchParams.get("mobile");
  const limitParam = String(searchParams.get("limit") || "10").trim();
  const shouldFetchAll = limitParam.toLowerCase() === "all";
  const numericLimit = Number(limitParam);

  if (!mobile) {
    return NextResponse.json([], { status: 200 });
  }

  const customer = await Customer.findOne({ mobile });
  if (!customer) {
    return NextResponse.json([], { status: 200 });
  }

  const billQuery = Bill.find({
    customerId: customer._id,
    deleted: { $ne: true },
  })
    .sort({ createdAt: -1 });

  if (!shouldFetchAll && Number.isFinite(numericLimit) && numericLimit > 0) {
    billQuery.limit(numericLimit);
  } else if (!shouldFetchAll) {
    billQuery.limit(10);
  }

  const rows = await billQuery.lean();

  return NextResponse.json(rows);
}
