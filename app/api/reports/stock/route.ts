import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ItemStock from "@/models/ItemStock";
import Stock from "@/models/Stock";
import Bill from "@/models/Bill";

export async function GET() {
  await dbConnect();

  // All items with current stock
  const stocks = await ItemStock.find({}).lean();

  const report = [];

  for (const s of stocks) {
    // Total purchased
    const purchases = await Stock.aggregate([
      { $unwind: "$items" },
      { $match: { "items.name": s.itemName } },
      { $group: { _id: null, total: { $sum: "$items.qty" } } },
    ]);

    // Total sold
    const sales = await Bill.aggregate([
      { $match: { deleted: false } },
      { $unwind: "$items" },
      { $match: { "items.name": s.itemName } },
      { $group: { _id: null, total: { $sum: "$items.qty" } } },
    ]);

    report.push({
      itemName: s.itemName,
      availableQty: s.availableQty,
      totalPurchased: purchases[0]?.total || 0,
      totalSold: sales[0]?.total || 0,
      lowStock: s.availableQty <= 5, // threshold
    });
  }

  return NextResponse.json(report);
}
