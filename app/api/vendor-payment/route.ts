import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import VendorPayment from "@/models/VendorPayment";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { vendorId, amount, note } =
      await req.json();

    if (!vendorId || !amount) {
      return NextResponse.json(
        { error: "Invalid payment data" },
        { status: 400 }
      );
    }

    const payment =
      await VendorPayment.create({
        vendorId,
        amount,
        note,
      });

    return NextResponse.json(
      payment,
      { status: 201 }
    );

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
