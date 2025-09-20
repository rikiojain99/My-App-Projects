import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bill from "@/models/Bill";

export async function GET() {
  await dbConnect();
  const bills = await Bill.find({}).sort({ createdAt: -1 });
  return NextResponse.json(bills);
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const data = await req.json();

    const bill = await Bill.create({
      customerName: data.customerName,
      customerType: data.customerType,
      city: data.city,
      mobile: data.mobile,
      purchases: data.purchases,
      grandTotal: data.grandTotal,
    });

    return NextResponse.json(bill, { status: 201 });
  } catch (err: any) {
    console.error("Bill creation failed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
