import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Manufacturing from "@/models/Manufacturing";
import ItemStock from "@/models/ItemStock";
import Item from "@/models/Item";

/* =========================================
   CREATE MANUFACTURING ENTRY
========================================= */
export async function POST(req: Request) {
  try {
    await dbConnect();
    const { productName, producedQty, inputs } = await req.json();

    if (!productName || producedQty <= 0 || !inputs?.length) {
      return NextResponse.json(
        { error: "Invalid manufacturing data" },
        { status: 400 }
      );
    }

    let totalCost = 0;

    // Normalize product name (support code)
    const productDoc = await Item.findOne({
      $or: [{ name: productName }, { code: productName }],
    });

    const finalProductName = productDoc?.name || productName;

    /* -------- RAW MATERIAL VALIDATION -------- */
    for (const raw of inputs) {
      // Resolve name from code if needed
      const itemDoc = await Item.findOne({
        $or: [{ name: raw.itemName }, { code: raw.itemName }],
      });

      const finalName = itemDoc?.name || raw.itemName;
      raw.itemName = finalName;

      let stock = await ItemStock.findOne({ itemName: finalName });

      // Allow NEW raw material
      if (!stock) {
        stock = await ItemStock.create({
          itemName: finalName,
          availableQty: 0,
          rate: raw.rate || 0,
        });
      }

      if (stock.availableQty < raw.qtyUsed) {
        return NextResponse.json(
          { error: `Insufficient stock for ${finalName}` },
          { status: 400 }
        );
      }

      raw.rate = stock.rate ?? raw.rate;
      raw.cost = raw.qtyUsed * raw.rate;
      totalCost += raw.cost;
    }

    /* -------- DEDUCT RAW STOCK -------- */
    for (const raw of inputs) {
      await ItemStock.findOneAndUpdate(
        { itemName: raw.itemName },
        { $inc: { availableQty: -raw.qtyUsed } }
      );
    }

    /* -------- ADD FINISHED PRODUCT STOCK -------- */
    await ItemStock.findOneAndUpdate(
      { itemName: finalProductName },
      { $inc: { availableQty: producedQty } },
      { upsert: true }
    );

    await Item.updateOne(
      { name: finalProductName },
      { $setOnInsert: { name: finalProductName } },
      { upsert: true }
    );

    const record = await Manufacturing.create({
      productName: finalProductName,
      producedQty,
      inputs,
      totalCost,
      costPerUnit: totalCost / producedQty,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (err: any) {
    console.error("Manufacturing error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* =========================================
   GET: SUGGESTIONS / LAST RECIPE / HISTORY
========================================= */
export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q");
    const productName = searchParams.get("productName");

    // Load last recipe
    if (productName) {
      const itemDoc = await Item.findOne({
        $or: [{ name: productName }, { code: productName }],
      });

      const finalName = itemDoc?.name || productName;

      const last = await Manufacturing.findOne({
        productName: finalName,
      }).sort({ createdAt: -1 });

      return NextResponse.json(last || null);
    }

    // Product suggestions
    if (q && q.length >= 2) {
      const items = await Item.find({
        $or: [
          { name: { $regex: q, $options: "i" } },
          { code: { $regex: q, $options: "i" } },
        ],
      }).select("name");

      const names = items.map((i) => i.name);

      const products = await Manufacturing.distinct("productName", {
        productName: { $in: names },
      });

      return NextResponse.json(products);
    }

    const all = await Manufacturing.find().sort({ createdAt: -1 });
    return NextResponse.json(all);
  } catch (err) {
    console.error("Manufacturing GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
