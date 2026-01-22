import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ItemStock from "@/models/ItemStock";
import Item from "@/models/Item";

export async function POST(req: Request) {
  await dbConnect();
  const { items } = await req.json();

  for (const it of items) {
    await Item.updateOne(
      { name: it.name },
      { $setOnInsert: { name: it.name } },
      { upsert: true }
    );

    await ItemStock.updateOne(
      { itemName: it.name },
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
