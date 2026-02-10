import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ItemStock from "@/models/ItemStock";
import Item from "@/models/Item";

export async function POST(req: Request) {
  await dbConnect();
  const { items } = await req.json();

  for (const it of items) {
    const searchValue = (it.name || "").trim();

    // 🔎 Find item by name OR code
    let item = await Item.findOne({
      $or: [
        { name: searchValue },
        { code: searchValue.toUpperCase() },
      ],
    });

    // ✅ If not found → create new item
    if (!item) {
      item = await Item.create({
        name: searchValue,
      });
    }

    // 🔥 Always use canonical name for stock
    const canonicalName = item.name;

    await ItemStock.updateOne(
      { itemName: canonicalName },
      {
        $set: {
          availableQty: it.qty,
          rate: it.rate,
          source: "OPENING",
          lastUpdated: new Date(),
        },
      },
      { upsert: true }
    );
  }

  return NextResponse.json({ success: true });
}
