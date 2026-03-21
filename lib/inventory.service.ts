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
  const existingQuery = ItemStock.findOne({ itemName: name });
  if (session) existingQuery.session(session);

  const existing = await existingQuery;
  const currentQty = Number(existing?.availableQty || 0);
  const currentRate = Number(existing?.rate || 0);
  const incomingQty = Number(qty || 0);
  const incomingRate = Number(rate || 0);
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

  return ItemStock.findOneAndUpdate(
    { itemName: name },
    {
      $set: {
        availableQty: nextQty,
        rate: nextRate,
        lastUpdated: new Date(),
      },
    },
    { upsert: true, session }
  );
}
