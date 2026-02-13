import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Stock from "@/models/Stock";
import Bill from "@/models/Bill";
import Expense from "@/models/Expense";

export async function GET() {
  await dbConnect();

  /* ==============================
     1️⃣ AVG COST CALCULATION
  ============================== */

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

  /* ==============================
     2️⃣ SALES AGGREGATION
  ============================== */

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

  let totalRevenue = 0;
  let totalGrossProfit = 0;

  const report = salesAgg.map((s) => {
    const avgCost = costMap[s._id] || 0;
    const cost = avgCost * s.soldQty;
    const profit = s.revenue - cost;

    totalRevenue += s.revenue;
    totalGrossProfit += profit;

    return {
      itemName: s._id,
      soldQty: s.soldQty,
      revenue: s.revenue,
      avgCost: Number(avgCost.toFixed(2)),
      profit: Number(profit.toFixed(2)),
    };
  });

  /* ==============================
     3️⃣ EXPENSE AGGREGATION
  ============================== */

  const expenseAgg = await Expense.aggregate([
    {
      $group: {
        _id: null,
        totalExpense: { $sum: "$amount" },
      },
    },
  ]);

  const totalExpense = expenseAgg[0]?.totalExpense || 0;

  /* ==============================
     4️⃣ NET PROFIT
  ============================== */

  const netProfit = totalGrossProfit - totalExpense;

  /* ==============================
     FINAL RESPONSE
  ============================== */

  return NextResponse.json({
    items: report,
    summary: {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalGrossProfit: Number(totalGrossProfit.toFixed(2)),
      totalExpense: Number(totalExpense.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
    },
  });
}
