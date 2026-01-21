import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ItemStock from "@/models/ItemStock";

export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  const query = search
    ? { itemName: { $regex: search, $options: "i" } }
    : {};

  const stocks = await ItemStock.find(query)
    .sort({ itemName: 1 })
    .lean();

  return NextResponse.json(stocks);
}
