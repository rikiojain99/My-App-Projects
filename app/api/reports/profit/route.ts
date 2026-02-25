import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Stock from "@/models/Stock";
import Bill from "@/models/Bill";
import Expense from "@/models/Expense";

export async function GET(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const buildRange = (field: string) => {
    if (!from && !to) return {};
    const range: Record<string, Date> = {};
    if (from) range.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      range.$lte = end;
    }
    return { [field]: range };
  };

  const billMatch: Record<string, any> = {
    deleted: false,
    ...buildRange("createdAt"),
  };
  const stockMatch: Record<string, any> = buildRange("purchaseDate");
  const expenseMatch: Record<string, any> = buildRange("date");

  /* ==============================
     1️⃣ AVG COST CALCULATION
  ============================== */

  const purchaseAgg = await Stock.aggregate([
    ...(Object.keys(stockMatch).length ? [{ $match: stockMatch }] : []),
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
    { $match: billMatch },
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
    ...(Object.keys(expenseMatch).length ? [{ $match: expenseMatch }] : []),
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
     5️⃣ MONTHLY TREND (CHART DATA)
  ============================== */
  const revenueByMonth = await Bill.aggregate([
    { $match: billMatch },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m",
            date: "$createdAt",
          },
        },
        revenue: {
          $sum: { $ifNull: ["$finalTotal", "$grandTotal"] },
        },
      },
    },
  ]);

  const stockExpenseByMonth = await Stock.aggregate([
    ...(Object.keys(stockMatch).length ? [{ $match: stockMatch }] : []),
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m",
            date: "$purchaseDate",
          },
        },
        expense: { $sum: "$grandTotal" },
      },
    },
  ]);

  const directExpenseByMonth = await Expense.aggregate([
    ...(Object.keys(expenseMatch).length ? [{ $match: expenseMatch }] : []),
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m",
            date: "$date",
          },
        },
        expense: { $sum: "$amount" },
      },
    },
  ]);

  const monthMap: Record<
    string,
    { revenue: number; stockExpense: number; directExpense: number }
  > = {};

  revenueByMonth.forEach((r) => {
    const month = r._id as string;
    monthMap[month] ??= {
      revenue: 0,
      stockExpense: 0,
      directExpense: 0,
    };
    monthMap[month].revenue = Number(r.revenue || 0);
  });

  stockExpenseByMonth.forEach((s) => {
    const month = s._id as string;
    monthMap[month] ??= {
      revenue: 0,
      stockExpense: 0,
      directExpense: 0,
    };
    monthMap[month].stockExpense = Number(s.expense || 0);
  });

  directExpenseByMonth.forEach((e) => {
    const month = e._id as string;
    monthMap[month] ??= {
      revenue: 0,
      stockExpense: 0,
      directExpense: 0,
    };
    monthMap[month].directExpense = Number(e.expense || 0);
  });

  const trendData = Object.keys(monthMap)
    .sort()
    .map((month) => {
      const revenue = monthMap[month].revenue;
      const expense =
        monthMap[month].stockExpense + monthMap[month].directExpense;
      const profit = revenue - expense;
      const margin =
        revenue > 0
          ? Number(((profit / revenue) * 100).toFixed(1))
          : 0;

      return {
        month,
        revenue: Number(revenue.toFixed(2)),
        expense: Number(expense.toFixed(2)),
        profit: Number(profit.toFixed(2)),
        margin,
      };
    });

  /* ==============================
     FINAL RESPONSE
  ============================== */

  return NextResponse.json({
    items: report,
    trendData,
    summary: {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalGrossProfit: Number(totalGrossProfit.toFixed(2)),
      totalExpense: Number(totalExpense.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
    },
  });
}
