import { NextResponse } from "next/server";
import mongoose, { type ClientSession } from "mongoose";
import dbConnect from "@/lib/mongodb";
import Manufacturing from "@/models/Manufacturing";
import ItemStock from "@/models/ItemStock";
import Item from "@/models/Item";

type RawInputPayload = {
  itemName?: string;
  qtyUsed?: number;
  rate?: number;
  fromStock?: boolean;
};

type ManufacturingPayload = {
  productName?: string;
  producedQty?: number;
  inputs?: RawInputPayload[];
};

const isTransactionUnsupported = (err: any) => {
  const msg = String(err?.message || "");
  return (
    msg.includes("Transaction numbers are only allowed") ||
    msg.includes("replica set member or mongos")
  );
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const canonicalItemNameQuery = (value: string) => {
  const safe = escapeRegex(value.trim());
  return {
    $or: [
      { name: { $regex: `^${safe}$`, $options: "i" } },
      { code: { $regex: `^${safe}$`, $options: "i" } },
    ],
  };
};

async function resolveItemName(
  value: string,
  session?: ClientSession
) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const itemQuery = Item.findOne(canonicalItemNameQuery(raw));
  if (session) itemQuery.session(session);
  const item = await itemQuery;

  return item?.name || raw;
}

async function createManufacturingEntry(
  payload: ManufacturingPayload,
  session?: ClientSession
) {
  const productName = String(payload?.productName || "").trim();
  const producedQty = Number(payload?.producedQty);
  const inputs = Array.isArray(payload?.inputs)
    ? payload.inputs
    : [];

  if (
    !productName ||
    !Number.isFinite(producedQty) ||
    producedQty <= 0 ||
    inputs.length === 0
  ) {
    throw new Error("Invalid manufacturing data");
  }

  const finalProductName = await resolveItemName(
    productName,
    session
  );
  const normalizedInputs: Array<{
    itemName: string;
    qtyUsed: number;
    rate: number;
    cost: number;
    fromStock: boolean;
  }> = [];

  let totalCost = 0;

  for (const input of inputs) {
    const itemName = String(input?.itemName || "").trim();
    const qtyUsed = Number(input?.qtyUsed);
    const inputRate = Number(input?.rate);
    const fromStock = Boolean(input?.fromStock);

    if (
      !itemName ||
      !Number.isFinite(qtyUsed) ||
      qtyUsed <= 0 ||
      !Number.isFinite(inputRate) ||
      inputRate < 0
    ) {
      throw new Error("Invalid raw material data");
    }

    const finalItemName = await resolveItemName(itemName, session);
    let finalRate = inputRate;

    if (fromStock) {
      const stockQuery = ItemStock.findOne({
        itemName: finalItemName,
      });
      if (session) stockQuery.session(session);
      const stock = await stockQuery;

      if (!stock || stock.availableQty < qtyUsed) {
        throw new Error(`Insufficient stock for ${finalItemName}`);
      }

      finalRate = Number(stock.rate ?? inputRate);
    } else {
      await Item.updateOne(
        { name: finalItemName },
        { $setOnInsert: { name: finalItemName } },
        session ? { upsert: true, session } : { upsert: true }
      );
    }

    const cost = Number((qtyUsed * finalRate).toFixed(2));
    totalCost += cost;

    normalizedInputs.push({
      itemName: finalItemName,
      qtyUsed,
      rate: finalRate,
      cost,
      fromStock,
    });
  }

  for (const raw of normalizedInputs.filter((r) => r.fromStock)) {
    const deductResult = await ItemStock.updateOne(
      {
        itemName: raw.itemName,
        availableQty: { $gte: raw.qtyUsed },
      },
      {
        $inc: { availableQty: -raw.qtyUsed },
        $set: { lastUpdated: new Date() },
      },
      session ? { session } : {}
    );

    if ((deductResult.modifiedCount || 0) === 0) {
      throw new Error(`Insufficient stock for ${raw.itemName}`);
    }
  }

  const roundedTotalCost = Number(totalCost.toFixed(2));
  const costPerUnit = Number(
    (roundedTotalCost / producedQty).toFixed(2)
  );

  await ItemStock.findOneAndUpdate(
    { itemName: finalProductName },
    {
      $inc: { availableQty: producedQty },
      $set: { lastUpdated: new Date() },
      $setOnInsert: { rate: costPerUnit },
    },
    session
      ? { upsert: true, new: true, session }
      : { upsert: true, new: true }
  );

  await Item.updateOne(
    { name: finalProductName },
    { $setOnInsert: { name: finalProductName } },
    session ? { upsert: true, session } : { upsert: true }
  );

  const payloadInputs = normalizedInputs.map((row) => ({
    itemName: row.itemName,
    qtyUsed: row.qtyUsed,
    rate: row.rate,
    cost: row.cost,
    fromStock: row.fromStock,
  }));

  const records = await Manufacturing.create(
    [
      {
        productName: finalProductName,
        producedQty,
        inputs: payloadInputs,
        totalCost: roundedTotalCost,
        costPerUnit,
      },
    ],
    session ? { session } : undefined
  );

  return records[0];
}

export async function POST(req: Request) {
  await dbConnect();
  const body = (await req.json()) as ManufacturingPayload;

  const session = await mongoose.startSession();

  try {
    let created: any = null;

    await session.withTransaction(async () => {
      created = await createManufacturingEntry(body, session);
    });

    if (!created) {
      throw new Error("Manufacturing create failed");
    }

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    if (isTransactionUnsupported(err)) {
      const created = await createManufacturingEntry(body);
      return NextResponse.json(created, { status: 201 });
    }

    const message = String(err?.message || "Server error");
    const status =
      message.includes("Invalid") ||
      message.includes("Insufficient")
        ? 400
        : 500;

    console.error("Manufacturing error:", message);
    return NextResponse.json({ error: message }, { status });
  } finally {
    session.endSession();
  }
}

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q");
    const productName = searchParams.get("productName");

    if (productName) {
      const finalName = await resolveItemName(productName);

      const last = await Manufacturing.findOne({
        productName: finalName,
      }).sort({ createdAt: -1 });

      return NextResponse.json(last || null);
    }

    if (q && q.length >= 2) {
      const itemNames = await Item.find({
        $or: [
          { name: { $regex: q, $options: "i" } },
          { code: { $regex: q, $options: "i" } },
        ],
      }).select("name");

      const names = itemNames.map((item) => item.name);
      const products = await Manufacturing.distinct(
        "productName",
        {
          productName: { $in: names },
        }
      );

      return NextResponse.json(products);
    }

    const all = await Manufacturing.find().sort({ createdAt: -1 });
    return NextResponse.json(all);
  } catch (err) {
    console.error("Manufacturing GET error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
