import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Stock from "@/models/Stock";
import Item from "@/models/Item";
import ItemStock from "@/models/ItemStock";

export async function GET() {
  await dbConnect();
  const stocks = await Stock.find().sort({ createdAt: -1 });
  return NextResponse.json(stocks);
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { vendorName, purchaseDate, items, grandTotal } =
      await req.json();

    for (const it of items) {
      const itemDoc = await Item.findOne({
        $or: [{ name: it.name }, { code: it.name }],
      });

      const finalName = itemDoc?.name || it.name;

      await Item.updateOne(
        { name: finalName },
        { $setOnInsert: { name: finalName } },
        { upsert: true }
      );

      await ItemStock.findOneAndUpdate(
        { itemName: finalName },
        {
          $inc: { availableQty: it.qty },
          $set: { lastUpdated: new Date() },
        },
        { upsert: true }
      );
    }

    const stock = await Stock.create({
      vendorName,
      purchaseDate,
      items,
      grandTotal,
    });

    return NextResponse.json(stock, { status: 201 });
  } catch (err: any) {
    console.error("Stock save failed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
