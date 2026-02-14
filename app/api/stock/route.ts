import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Stock from "@/models/Stock";
import Item from "@/models/Item";
import ItemStock from "@/models/ItemStock";

/* =====================================================
   GET STOCK HISTORY
===================================================== */
export async function GET() {
  await dbConnect();

  const stocks = await Stock.find()
    .sort({ createdAt: -1 });

  return NextResponse.json(stocks);
}

/* =====================================================
   CREATE STOCK ENTRY
===================================================== */
export async function POST(req: Request) {
  try {
    await dbConnect();

    const {
      vendorName,
      purchaseDate,
      items,
      grandTotal,
      extraExpense = 0,   // ✅ SAFE DEFAULT
    } = await req.json();

    /* =====================================================
       CALCULATE SUBTOTAL
    ===================================================== */
    const subTotal = items.reduce(
      (sum: number, i: any) => sum + i.total,
      0
    );

    /* =====================================================
       DISTRIBUTE EXTRA EXPENSE ACROSS MULTIPLE ITEMS
    ===================================================== */
    const updatedItems = items.map((it: any) => {
      if (extraExpense > 0 && subTotal > 0) {
        const ratio = it.total / subTotal;
        const itemExtra = ratio * extraExpense;

        const newTotal = it.total + itemExtra;
        const newRate = newTotal / it.qty;

        return {
          ...it,
          rate: Number(newRate.toFixed(2)),
          total: Number(newTotal.toFixed(2)),
        };
      }

      return it;
    });

    /* =====================================================
       UPDATE ITEM + STOCK QUANTITY
    ===================================================== */

    for (const it of updatedItems) {
      const itemDoc = await Item.findOne({
        $or: [{ name: it.name }, { code: it.name }],
      });

      const finalName = itemDoc?.name || it.name;

      // Ensure Item exists
      await Item.updateOne(
        { name: finalName },
        { $setOnInsert: { name: finalName } },
        { upsert: true }
      );

      // Update available quantity
      await ItemStock.findOneAndUpdate(
        { itemName: finalName },
        {
          $inc: { availableQty: it.qty },
          $set: { lastUpdated: new Date() },
        },
        { upsert: true }
      );
    }

    /* =====================================================
       CREATE STOCK RECORD
    ===================================================== */

    const stock = await Stock.create({
      vendorName,
      purchaseDate,
      items: updatedItems,   // ✅ save corrected cost
      grandTotal,
      extraExpense,
    });

    return NextResponse.json(stock, { status: 201 });

  } catch (err: any) {
    console.error("Stock save failed:", err.message);

    return NextResponse.json(
      { error: err.message },
      { status: 400 }
    );
  }
}
