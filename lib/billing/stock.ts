import Item from "@/models/Item";
import ItemStock from "@/models/ItemStock";
import type { ClientSession } from "mongoose";

const normalizeName = (value: unknown) =>
  String(value || "").trim();

const aggregateItemQty = (items: any[]) => {
  const qtyByName = new Map<string, number>();

  for (const item of items) {
    const itemName = normalizeName(item?.name);
    if (!itemName) continue;

    qtyByName.set(
      itemName,
      (qtyByName.get(itemName) || 0) + Number(item?.qty || 0)
    );
  }

  return qtyByName;
};

/* =====================================================
   Ensure Items + Stock Exist
===================================================== */
export async function ensureItemsExist(
  items: any[],
  session?: ClientSession
) {
  const itemNames = [...aggregateItemQty(items).keys()];

  if (itemNames.length === 0) {
    return;
  }

  await Item.bulkWrite(
    itemNames.map((itemName) => ({
      updateOne: {
        filter: { name: itemName },
        update: { $setOnInsert: { name: itemName } },
        upsert: true,
      },
    })),
    { session }
  );

  await ItemStock.bulkWrite(
    itemNames.map((itemName) => ({
      updateOne: {
        filter: { itemName },
        update: {
          $setOnInsert: {
            itemName,
            availableQty: 0,
            lastUpdated: new Date(),
          },
        },
        upsert: true,
      },
    })),
    { session }
  );
}

/* =====================================================
   Validate Stock
===================================================== */
export async function validateStock(
  items: any[],
  session?: ClientSession
) {
  const qtyByName = aggregateItemQty(items);
  const itemNames = [...qtyByName.keys()];

  if (itemNames.length === 0) {
    return;
  }

  const stocks = await ItemStock.find({
    itemName: { $in: itemNames },
  })
    .select("itemName availableQty")
    .lean()
    .session(session || null);

  const stockMap = new Map(
    stocks.map((stock: any) => [
      normalizeName(stock.itemName),
      Number(stock.availableQty || 0),
    ])
  );

  for (const [itemName, qty] of qtyByName.entries()) {
    const availableQty = Number(stockMap.get(itemName) || 0);

    if (availableQty > 0 && availableQty < qty) {
      throw new Error(`Insufficient stock for ${itemName}`);
    }
  }
}

/* =====================================================
   Deduct Stock
===================================================== */
export async function deductStock(
  items: any[],
  session?: ClientSession
) {
  const qtyByName = aggregateItemQty(items);
  const itemNames = [...qtyByName.keys()];

  if (itemNames.length === 0) {
    return;
  }

  const stocks = await ItemStock.find({
    itemName: { $in: itemNames },
  })
    .select("itemName availableQty")
    .lean()
    .session(session || null);

  const availableByName = new Map(
    stocks.map((stock: any) => [
      normalizeName(stock.itemName),
      Number(stock.availableQty || 0),
    ])
  );

  const now = new Date();
  const operations = [...qtyByName.entries()]
    .filter(([itemName]) => Number(availableByName.get(itemName) || 0) > 0)
    .map(([itemName, qty]) => ({
      updateOne: {
        filter: { itemName },
        update: {
          $inc: { availableQty: -qty },
          $set: { lastUpdated: now },
        },
      },
    }));

  if (operations.length === 0) {
    return;
  }

  await ItemStock.bulkWrite(operations, { session });
}
