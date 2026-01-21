import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Stock from "@/models/Stock";
import Bill from "@/models/Bill";

export async function GET() {
  await dbConnect();

  // 1. Calculate average cost per item
  const purchaseAgg = await Stock.aggregate([
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.name",
        totalQty: { $sum: "$items.qty" },
        totalCost: {
          $sum: { $multiply: ["$items.qty", "$items.rate"] },
        },
      },
    },
    {
      $project: {
        itemName: "$_id",
        avgCost: { $divide: ["$totalCost", "$totalQty"] },
      },
    },
  ]);

  const costMap: Record<string, number> = {};
  purchaseAgg.forEach((p) => {
    costMap[p.itemName] = p.avgCost;
  });

  // 2. Calculate profit from bills
  const salesAgg = await Bill.aggregate([
    { $match: { deleted: false } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.name",
        soldQty: { $sum: "$items.qty" },
        revenue: {
          $sum: { $multiply: ["$items.qty", "$items.rate"] },
        },
      },
    },
  ]);

  const report = salesAgg.map((s) => {
    const avgCost = costMap[s._id] || 0;
    const cost = avgCost * s.soldQty;
    const profit = s.revenue - cost;

    return {
      itemName: s._id,
      soldQty: s.soldQty,
      revenue: s.revenue,
      avgCost: Number(avgCost.toFixed(2)),
      profit: Number(profit.toFixed(2)),
    };
  });

  return NextResponse.json(report);
}
