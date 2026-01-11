import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ItemStock from "@/models/ItemStock";

export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ availableQty: 0 });
  }

  const stock = await ItemStock.findOne({
    itemName: name,
  });

  return NextResponse.json({
    availableQty: stock?.availableQty || 0,
  });
}
