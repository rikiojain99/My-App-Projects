import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ItemStock from "@/models/ItemStock";
import Item from "@/models/Item";

export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  let query: any = {};

  if (search) {
    const items = await Item.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ],
    }).select("name");

    const names = items.map((i) => i.name);

    query = {
      itemName: { $in: names },
    };
  }

  const stocks = await ItemStock.find(query)
    .sort({ itemName: 1 })
    .lean();

  return NextResponse.json(stocks);
}

type StockHoldingUpdateBody = {
  id?: string;
  itemName?: string;
  availableQty?: number;
  rate?: number;
};

export async function PATCH(req: Request) {
  try {
    await dbConnect();

    const body = (await req.json()) as StockHoldingUpdateBody;
    const id = String(body.id || "").trim();
    const itemName = String(body.itemName || "").trim();
    const availableQty = Number(body.availableQty);
    const rate = Number(body.rate);

    if (!id) {
      return NextResponse.json(
        { error: "Stock id is required" },
        { status: 400 }
      );
    }

    if (!itemName) {
      return NextResponse.json(
        { error: "Item name is required" },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(availableQty) ||
      availableQty < 0 ||
      !Number.isFinite(rate) ||
      rate < 0
    ) {
      return NextResponse.json(
        { error: "Qty and rate must be valid non-negative numbers" },
        { status: 400 }
      );
    }

    const existing = await ItemStock.findById(id);

    if (!existing) {
      return NextResponse.json(
        { error: "Stock record not found" },
        { status: 404 }
      );
    }

    const oldItemName = String(existing.itemName || "").trim();
    const nameChanged = oldItemName !== itemName;

    if (nameChanged) {
      const duplicate = await ItemStock.findOne({
        _id: { $ne: existing._id },
        itemName,
      }).lean();

      if (duplicate) {
        return NextResponse.json(
          { error: "Another stock record already uses this item name" },
          { status: 409 }
        );
      }
    }

    existing.itemName = itemName;
    existing.availableQty = availableQty;
    existing.rate = rate;
    existing.lastUpdated = new Date();
    await existing.save();

    if (nameChanged) {
      const itemUpdate = await Item.updateMany(
        { name: oldItemName },
        { $set: { name: itemName } }
      );

      if ((itemUpdate.modifiedCount || 0) === 0) {
        await Item.updateOne(
          { name: itemName },
          { $setOnInsert: { name: itemName } },
          { upsert: true }
        );
      }
    } else {
      await Item.updateOne(
        { name: itemName },
        { $setOnInsert: { name: itemName } },
        { upsert: true }
      );
    }

    return NextResponse.json(existing);
  } catch (err: any) {
    console.error("Stock holdings update failed:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update stock" },
      { status: 500 }
    );
  }
}
