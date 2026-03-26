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

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const query = String(searchParams.get("name") || "").trim();

  if (!query) {
    return NextResponse.json({ availableQty: 0, matched: false });
  }

  // 🔎 1️⃣ Find item by name OR code
  const exactRegex = `^${escapeRegex(query)}$`;

  const directStock = await ItemStock.findOne({
    itemName: { $regex: exactRegex, $options: "i" },
  })
    .select("itemName availableQty")
    .lean<LeanStock>();

  if (directStock) {
    return NextResponse.json({
      availableQty: directStock.availableQty ?? 0,
      matched: true,
      itemName: directStock.itemName,
    });
  }

  const item = await Item.findOne({
    $or: [
      { name: { $regex: exactRegex, $options: "i" } },
      { code: { $regex: exactRegex, $options: "i" } },
    ],
  })
    .select("name code")
    .lean<LeanItem>();

  if (!item) {
    return NextResponse.json({ availableQty: 0, matched: false });
  }

  // 🔎 2️⃣ Find stock by real item name
  const stock = await ItemStock.findOne({
    itemName: item.name,
  })
    .select("itemName availableQty")
    .lean<LeanStock>();

  return NextResponse.json({
    availableQty: stock?.availableQty ?? 0,
    matched: true,
    itemName: item.name,
    code: item.code ?? null,
  });
}
