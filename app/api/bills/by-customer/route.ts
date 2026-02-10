import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bill from "@/models/Bill";
import Customer from "@/models/Customer";

export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const mobile = searchParams.get("mobile");

  if (!mobile) {
    return NextResponse.json([], { status: 200 });
  }

  const customer = await Customer.findOne({ mobile });
  if (!customer) {
    return NextResponse.json([], { status: 200 });
  }

  const bills = await Bill.find({
    customerId: customer._id,
    deleted: { $ne: true },
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return NextResponse.json(bills);
}
