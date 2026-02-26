import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Stock from "@/models/Stock";
import Bill from "@/models/Bill";
import Expense from "@/models/Expense";
import ItemStock from "@/models/ItemStock";

const normalizeName = (name: unknown) =>
  String(name || "").trim().toLowerCase();

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
  const expenseMatch: Record<string, any> = buildRange("date");

  /* ==============================
     1) COST PER ITEM
     - all-time weighted purchase cost
     - fallback to ItemStock.rate
  ============================== */

  const purchaseAgg = await Stock.aggregate([
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.name",
        totalQty: { $sum: { $ifNull: ["$items.qty", 0] } },
        totalCost: {
          $sum: {
            $multiply: [
              { $ifNull: ["$items.qty", 0] },
              { $ifNull: ["$items.rate", 0] },
            ],
          },
        },
      },
    },
  ]);

  const weightedCostMap: Record<string, number> = {};
  purchaseAgg.forEach((row: any) => {
    const itemName = normalizeName(row?._id);
    const totalQty = Number(row?.totalQty || 0);
    const totalCost = Number(row?.totalCost || 0);

    if (!itemName || totalQty <= 0) return;
    weightedCostMap[itemName] = totalCost / totalQty;
  });

  const stockRates = await ItemStock.find({})
    .select("itemName rate")
    .lean();

  const stockRateMap: Record<string, number> = {};
  stockRates.forEach((row: any) => {
    const itemName = normalizeName(row?.itemName);
    const rate = Number(row?.rate ?? 0);

    if (!itemName || !Number.isFinite(rate) || rate < 0) return;
    stockRateMap[itemName] = rate;
  });

  const resolveUnitCost = (itemName: string) => {
    const key = normalizeName(itemName);
    if (!key) return 0;
    return weightedCostMap[key] ?? stockRateMap[key] ?? 0;
  };

  /* ==============================
     2) ITEM-WISE SALES + GROSS PROFIT
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

  const report = salesAgg.map((row: any) => {
    const itemName = String(row?._id || "");
    const soldQty = Number(row?.soldQty || 0);
    const revenue = Number(row?.revenue || 0);

    const unitCost = resolveUnitCost(itemName);
    const cost = unitCost * soldQty;
    const profit = revenue - cost;

    totalRevenue += revenue;
    totalGrossProfit += profit;

    return {
      itemName,
      soldQty,
      revenue: Number(revenue.toFixed(2)),
      avgCost: Number(unitCost.toFixed(2)),
      profit: Number(profit.toFixed(2)),
    };
  });

  /* ==============================
     3) DIRECT EXPENSE
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

  const totalExpense = Number(expenseAgg[0]?.totalExpense || 0);

  /* ==============================
     4) NET PROFIT
  ============================== */

  const netProfit = totalGrossProfit - totalExpense;

  /* ==============================
     5) MONTHLY TREND
     expense = COGS + direct expense
  ============================== */

  const salesByMonthAndItem = await Bill.aggregate([
    { $match: billMatch },
    { $unwind: "$items" },
    {
      $group: {
        _id: {
          month: {
            $dateToString: {
              format: "%Y-%m",
              date: "$createdAt",
            },
          },
          itemName: "$items.name",
        },
        soldQty: { $sum: "$items.qty" },
        revenue: {
          $sum: { $multiply: ["$items.qty", "$items.rate"] },
        },
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
    { revenue: number; cogs: number; directExpense: number }
  > = {};

  salesByMonthAndItem.forEach((row: any) => {
    const month = String(row?._id?.month || "");
    const itemName = String(row?._id?.itemName || "");
    const soldQty = Number(row?.soldQty || 0);
    const revenue = Number(row?.revenue || 0);

    if (!month) return;

    monthMap[month] ??= {
      revenue: 0,
      cogs: 0,
      directExpense: 0,
    };

    monthMap[month].revenue += revenue;
    monthMap[month].cogs += resolveUnitCost(itemName) * soldQty;
  });

  directExpenseByMonth.forEach((row: any) => {
    const month = String(row?._id || "");
    const expense = Number(row?.expense || 0);

    if (!month) return;

    monthMap[month] ??= {
      revenue: 0,
      cogs: 0,
      directExpense: 0,
    };

    monthMap[month].directExpense = expense;
  });

  const trendData = Object.keys(monthMap)
    .sort()
    .map((month) => {
      const revenue = monthMap[month].revenue;
      const expense =
        monthMap[month].cogs + monthMap[month].directExpense;
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

