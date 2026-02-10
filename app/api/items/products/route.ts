import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Manufacturing from "@/models/Manufacturing";

export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q || q.length < 2) return NextResponse.json([]);

  const list = await Manufacturing.distinct("productName", {
    productName: { $regex: q, $options: "i" },
  });

  return NextResponse.json(list.slice(0, 10));
}
