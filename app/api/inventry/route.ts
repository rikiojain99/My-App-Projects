import { NextRequest, NextResponse } from "next/server";
import Inventry from "@/models/Inventry";
import connectDB from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, type, category, qty, rate, shop } = body;

    if (!name || !qty || !shop) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existing = await Inventry.findOne({ name, shop });
    let item;

    if (existing) {
      existing.qty += Number(qty);
      existing.rate = Number(rate); // update rate if needed
      item = await existing.save();
    } else {
      item = await Inventry.create({
        name,
        type,
        category,
        qty: Number(qty),
        rate: Number(rate),
        shop,
      });
    }

    return NextResponse.json({ ok: true, item }, { status: 200 });
  } catch (err) {
    console.error("Inventry add/update failed:", err);
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { search } = Object.fromEntries(req.nextUrl.searchParams.entries());

    let items;

    if (search) {
      items = await Inventry.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { code: { $regex: search, $options: "i" } },
        ],
      });
    } else {
      items = await Inventry.find();
    }

    return NextResponse.json(items);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

