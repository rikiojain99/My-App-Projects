import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Stock from "@/models/Stock";
import Item from "@/models/Item";
import ItemStock from "@/models/ItemStock"; // ✅ NEW
// CREATE STOCK


// GET ALL STOCK
export async function GET() {
  await dbConnect();
  const stocks = await Stock.find().sort({ createdAt: -1 });
  return NextResponse.json(stocks);
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { vendorName, purchaseDate, items, grandTotal } = await req.json();

    // ✅ Save item names for suggestions (existing logic)
    for (const it of items) {
      await Item.updateOne(
        { name: it.name },
        { $setOnInsert: { name: it.name } },
        { upsert: true }
      );
    }

    // ✅ NEW: UPDATE INVENTORY
    for (const it of items) {
      await ItemStock.findOneAndUpdate(
        { itemName: it.name },
        {
          $inc: { availableQty: it.qty },
          $set: { lastUpdated: new Date() },
        },
        { upsert: true, new: true }
      );
    }

    // ✅ Save stock bill (existing logic)
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