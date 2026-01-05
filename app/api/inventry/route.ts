// /app/api/inventry/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Inventry from "@/models/Inventry"; // Make sure you have Inventry model

export async function GET() {
  await dbConnect();

  try {
    const items = await Inventry.find({}).sort({ createdAt: -1 });
    return NextResponse.json(items, { status: 200 });
  } catch (err: any) {
    console.error("Failed to fetch inventry:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
