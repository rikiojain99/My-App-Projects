import ItemStock from "@/models/ItemStock";

export async function getStockByName(name: string) {
  return ItemStock.findOne({
    itemName: { $regex: `^${name}`, $options: "i" },
  });
}

export async function deductStock(
  name: string,
  qty: number,
  session?: any
) {
  return ItemStock.findOneAndUpdate(
    { itemName: name },
    { $inc: { availableQty: -qty } },
    { session }
  );
}

export async function addStock(
  name: string,
  qty: number,
  rate = 0,
  session?: any
) {
  return ItemStock.findOneAndUpdate(
    { itemName: name },
    {
      $inc: { availableQty: qty },
      $setOnInsert: { rate },
    },
    { upsert: true, session }
  );
}
