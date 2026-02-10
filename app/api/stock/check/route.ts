import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Item from "@/models/Item";
import ItemStock from "@/models/ItemStock";

type LeanItem = {
  name: string;
  code?: string;
};

type LeanStock = {
  itemName: string;
  availableQty: number;
};

export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("name");

  if (!query) {
    return NextResponse.json({ availableQty: 0 });
  }

  // 🔎 1️⃣ Find item by name OR code
  const item = await Item.findOne({
    $or: [
      { name: { $regex: `^${query}$`, $options: "i" } },
      { code: { $regex: `^${query}$`, $options: "i" } },
    ],
  })
    .select("name code")
    .lean<LeanItem>();

  if (!item) {
    return NextResponse.json({ availableQty: 0 });
  }

  // 🔎 2️⃣ Find stock by real item name
  const stock = await ItemStock.findOne({
    itemName: item.name,
  })
    .select("itemName availableQty")
    .lean<LeanStock>();

  return NextResponse.json({
    availableQty: stock?.availableQty ?? 0,
  });
}
