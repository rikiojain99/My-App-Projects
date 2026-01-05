import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Inventry from "@/models/Inventry";

export async function GET(req: Request) {
  await dbConnect();
  try {
    const items = await Inventry.find().sort({ name: 1 });
    return NextResponse.json(items);
  } catch (err: any) {
    console.error("Fetch inventry failed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await dbConnect();

  try {
    const data = await req.json();
    const { name, type, cty, qty, rate, shop } = data;

    if (!name || !qty || !rate || !shop) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let existing = await Inventry.findOne({ name, shop });

    if (existing) {
      existing.qty += qty;
      if (type) existing.type = type;
      if (cty) existing.cty = cty;
      if (rate) existing.rate = rate;
      await existing.save();
      return NextResponse.json({ ok: true, item: existing });
    }

    const newItem = await Inventry.create({ name, type, cty, qty, rate, shop });
    return NextResponse.json({ ok: true, item: newItem });
  } catch (err: any) {
    console.error("Inventry add/update failed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
