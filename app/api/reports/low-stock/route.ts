import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ItemStock from "@/models/ItemStock";

export async function GET() {
  await dbConnect();

  const lowStockItems = await ItemStock.find({
    availableQty: { $lte: 5 },
  }).select("itemName availableQty");

  return NextResponse.json(lowStockItems);
}
