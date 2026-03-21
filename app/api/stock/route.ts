import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Stock from "@/models/Stock";
import Item from "@/models/Item";
import ItemStock from "@/models/ItemStock";

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

async function resolveCanonicalItemName(rawName: string) {
  const searchValue = String(rawName || "").trim();
  if (!searchValue) return "";

  const itemDoc = await Item.findOne({
    $or: [
      { name: searchValue },
      { code: searchValue.toUpperCase() },
    ],
  });

  const finalName = itemDoc?.name || searchValue;

  await Item.updateOne(
    { name: finalName },
    { $setOnInsert: { name: finalName } },
    { upsert: true }
  );

  return finalName;
}

function aggregateQtyByItemName(
  items: Array<{ name: string; qty: number }>
) {
  const map = new Map<string, number>();

  for (const item of items) {
    const name = String(item.name || "").trim();
    if (!name) continue;

    map.set(name, (map.get(name) || 0) + Number(item.qty || 0));
  }

  return map;
}

async function getHistoryAverageRate(itemName: string) {
  const result = await Stock.aggregate([
    { $unwind: "$items" },
    { $match: { "items.name": itemName } },
    {
      $group: {
        _id: null,
        totalQty: { $sum: "$items.qty" },
        totalCost: { $sum: "$items.total" },
      },
    },
  ]);

  const row = result[0];
  const totalQty = Number(row?.totalQty || 0);
  const totalCost = Number(row?.totalCost || 0);

  if (!Number.isFinite(totalQty) || totalQty <= 0) {
    return null;
  }

  return roundMoney(totalCost / totalQty);
}

async function normalizePatchedStockItems(rawItems: any[]) {
  const normalized: Array<{
    name: string;
    qty: number;
    rate: number;
    total: number;
  }> = [];

  for (const rawItem of rawItems) {
    const name = await resolveCanonicalItemName(rawItem?.name);
    const qty = Number(rawItem?.qty);
    const rate = Number(rawItem?.rate);

    if (!name) {
      throw new Error("Item name is required");
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error(`Invalid qty for ${name}`);
    }

    if (!Number.isFinite(rate) || rate < 0) {
      throw new Error(`Invalid rate for ${name}`);
    }

    normalized.push({
      name,
      qty,
      rate,
      total: roundMoney(qty * rate),
    });
  }

  return normalized;
}

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

      const existingStock = await ItemStock.findOne({
        itemName: finalName,
      });

      const currentQty = Number(existingStock?.availableQty || 0);
      const currentRate = Number(existingStock?.rate || 0);
      const incomingQty = Number(it.qty || 0);
      const incomingRate = Number(it.rate || 0);
      const nextQty = currentQty + incomingQty;

      const nextRate =
        currentQty > 0 && nextQty > 0
          ? Number(
              (
                (currentQty * currentRate +
                  incomingQty * incomingRate) /
                nextQty
              ).toFixed(2)
            )
          : incomingRate;

      await ItemStock.findOneAndUpdate(
        { itemName: finalName },
        {
          $set: {
            availableQty: nextQty,
            rate: nextRate,
            lastUpdated: new Date(),
          },
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

type StockUpdateBody = {
  id?: string;
  vendorName?: string;
  purchaseDate?: string;
  extraExpense?: number;
  items?: Array<{
    name?: string;
    qty?: number;
    rate?: number;
  }>;
};

export async function PATCH(req: Request) {
  try {
    await dbConnect();

    const body = (await req.json()) as StockUpdateBody;
    const id = String(body.id || "").trim();
    const vendorName = String(body.vendorName || "").trim();
    const purchaseDate = String(body.purchaseDate || "").trim();
    const extraExpense = Number(body.extraExpense ?? 0);
    const hasItems = Array.isArray(body.items);

    if (!id) {
      return NextResponse.json(
        { error: "Stock id is required" },
        { status: 400 }
      );
    }

    if (!vendorName) {
      return NextResponse.json(
        { error: "Vendor name is required" },
        { status: 400 }
      );
    }

    if (!purchaseDate) {
      return NextResponse.json(
        { error: "Purchase date is required" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(extraExpense) || extraExpense < 0) {
      return NextResponse.json(
        {
          error:
            "Extra expense must be a valid non-negative number",
        },
        { status: 400 }
      );
    }

    const existing = await Stock.findById(id);

    if (!existing) {
      return NextResponse.json(
        { error: "Stock entry not found" },
        { status: 404 }
      );
    }

    let updatedItems = Array.isArray(existing.items)
      ? existing.items.map((item: any) => ({
          name: String(item?.name || "").trim(),
          qty: Number(item?.qty || 0),
          rate: Number(item?.rate || 0),
          total: roundMoney(
            Number(item?.total ?? Number(item?.qty || 0) * Number(item?.rate || 0))
          ),
        }))
      : [];

    if (hasItems) {
      if ((body.items || []).length === 0) {
        return NextResponse.json(
          { error: "At least one item is required" },
          { status: 400 }
        );
      }

      updatedItems = await normalizePatchedStockItems(body.items || []);
    }

    const oldQtyMap = aggregateQtyByItemName(
      Array.isArray(existing.items)
        ? existing.items.map((item: any) => ({
            name: String(item?.name || "").trim(),
            qty: Number(item?.qty || 0),
          }))
        : []
    );

    const newQtyMap = aggregateQtyByItemName(updatedItems);
    const affectedNames = Array.from(
      new Set([...oldQtyMap.keys(), ...newQtyMap.keys()])
    );
    const existingStocks = affectedNames.length
      ? await ItemStock.find({
          itemName: { $in: affectedNames },
        })
      : [];
    const stockMap = new Map(
      existingStocks.map((stock) => [stock.itemName, stock])
    );

    for (const itemName of affectedNames) {
      const currentAvailable = Number(
        stockMap.get(itemName)?.availableQty || 0
      );
      const deltaQty =
        Number(newQtyMap.get(itemName) || 0) -
        Number(oldQtyMap.get(itemName) || 0);
      const nextAvailable = currentAvailable + deltaQty;

      if (nextAvailable < 0) {
        return NextResponse.json(
          {
            error: `Cannot reduce ${itemName} below current available stock`,
          },
          { status: 400 }
        );
      }
    }

    const grandTotal = roundMoney(
      updatedItems.reduce(
        (sum: number, item: { total: number }) =>
          sum + Number(item.total || 0),
        0
      )
    );

    existing.vendorName = vendorName;
    existing.purchaseDate = new Date(purchaseDate);
    existing.extraExpense = extraExpense;
    existing.items = updatedItems;
    existing.grandTotal = grandTotal;

    await existing.save();

    for (const itemName of affectedNames) {
      const currentAvailable = Number(
        stockMap.get(itemName)?.availableQty || 0
      );
      const deltaQty =
        Number(newQtyMap.get(itemName) || 0) -
        Number(oldQtyMap.get(itemName) || 0);
      const nextAvailable = currentAvailable + deltaQty;
      const historyAverageRate =
        await getHistoryAverageRate(itemName);
      const currentRate = Number(stockMap.get(itemName)?.rate || 0);

      await ItemStock.findOneAndUpdate(
        { itemName },
        {
          $set: {
            availableQty: nextAvailable,
            rate:
              historyAverageRate !== null
                ? historyAverageRate
                : currentRate,
            lastUpdated: new Date(),
          },
        },
        { upsert: true }
      );
    }

    return NextResponse.json(existing);
  } catch (err: any) {
    console.error("Stock update failed:", err);

    return NextResponse.json(
      { error: err?.message || "Failed to update stock" },
      { status: 500 }
    );
  }
}
