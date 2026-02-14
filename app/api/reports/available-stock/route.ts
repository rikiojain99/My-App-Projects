import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Stock from "@/models/Stock";
import ItemStock from "@/models/ItemStock";

export async function GET() {
  await dbConnect();

  /* ================= GET STOCK QUANTITY ================= */
  const stockQty = await ItemStock.find();

  /* ================= CALCULATE AVG COST ================= */
  const purchaseAgg = await Stock.aggregate([
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.name",
        totalQty: { $sum: "$items.qty" },
        totalCost: {
          $sum: {
            $multiply: ["$items.qty", "$items.rate"],
          },
        },
        lastRate: { $last: "$items.rate" },
      },
    },
    {
      $project: {
        itemName: "$_id",
        avgCost: {
          $cond: [
            { $eq: ["$totalQty", 0] },
            0,
            { $divide: ["$totalCost", "$totalQty"] },
          ],
        },
        lastRate: 1,
      },
    },
  ]);

  const costMap: Record<string, any> = {};
  purchaseAgg.forEach((p) => {
    costMap[p.itemName] = {
      avgCost: Number(p.avgCost.toFixed(2)),
      lastRate: p.lastRate,
    };
  });

  /* ================= MERGE DATA ================= */
  const result = stockQty.map((item) => {
    const costData = costMap[item.itemName] || {
      avgCost: 0,
      lastRate: 0,
    };

    return {
      itemName: item.itemName,
      availableQty: item.availableQty,
      avgCost: costData.avgCost,
      lastPurchaseRate: costData.lastRate,
      stockValue:
        costData.avgCost * item.availableQty,
    };
  });

  return NextResponse.json(result);
}
