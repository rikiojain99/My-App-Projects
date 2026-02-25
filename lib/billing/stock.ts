import Item from "@/models/Item";
import ItemStock from "@/models/ItemStock";
import type { ClientSession } from "mongoose";

/* =====================================================
   Ensure Items + Stock Exist
===================================================== */
export async function ensureItemsExist(
  items: any[],
  session?: ClientSession
) {
  for (const it of items) {
    await Item.updateOne(
      { name: it.name },
      { $setOnInsert: { name: it.name } },
      { upsert: true, session }
    );

    const stock = await ItemStock.findOne({
      itemName: it.name,
    }).session(session || null);

    if (!stock) {
      await ItemStock.create(
        [
          {
            itemName: it.name,
            availableQty: 0,
          },
        ],
        { session }
      );
    }
  }
}

/* =====================================================
   Validate Stock
===================================================== */
export async function validateStock(
  items: any[],
  session?: ClientSession
) {
  for (const it of items) {
    const stock = await ItemStock.findOne({
      itemName: it.name,
    }).session(session || null);

    if (
      stock &&
      stock.availableQty > 0 &&
      stock.availableQty < it.qty
    ) {
      throw new Error(`Insufficient stock for ${it.name}`);
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
  for (const it of items) {
    const stock = await ItemStock.findOne({
      itemName: it.name,
    }).session(session || null);

    if (stock && stock.availableQty > 0) {
      await ItemStock.findOneAndUpdate(
        { itemName: it.name },
        {
          $inc: { availableQty: -it.qty },
          $set: { lastUpdated: new Date() },
        },
        { session }
      );
    }
  }
}
