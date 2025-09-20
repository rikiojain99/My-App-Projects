import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Customer from "@/models/Customer";

export async function GET(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const mobile = searchParams.get("mobile");

  if (!mobile) {
    return NextResponse.json({ error: "Mobile is required" }, { status: 400 });
  }

  const customer = await Customer.findOne({ mobile });
  return NextResponse.json(customer);
}

export async function POST(req: Request) {
  await dbConnect();
  const { name, type, city, mobile } = await req.json();

  try {
    let customer = await Customer.findOne({ mobile });
    if (!customer) {
      customer = await Customer.create({ name, type, city, mobile });
    }
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save customer" },
      { status: 400 }
    );
  }
}
