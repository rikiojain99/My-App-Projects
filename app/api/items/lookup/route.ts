import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Item from "@/models/Item";
import ItemStock from "@/models/ItemStock";

/* ================= RESPONSE TYPE ================= */
type LookupResult = {
  itemName: string;
  rate: number;
  availableQty: number;
  code: string | null;
};

export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q || q.length < 1) {
      return NextResponse.json([]);
    }

    /* 🔎 1️⃣ Find by name OR code */
    const items = await Item.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { code: { $regex: q, $options: "i" } },
      ],
    })
      .limit(10)
      .select("name code")
      .lean();

    if (!items.length) {
      return NextResponse.json([]);
    }

    const itemNames = items.map((i: any) => i.name);

    /* 🔎 2️⃣ Fetch stock */
    const stocks = await ItemStock.find({
      itemName: { $in: itemNames },
    })
      .select("itemName availableQty rate")
      .lean();

    /* 🔁 3️⃣ Merge safely */
    const results: LookupResult[] = items.map((item: any) => {
      const stock = stocks.find(
        (s: any) => s.itemName === item.name
      );

      return {
        itemName: item.name,
        rate: typeof stock?.rate === "number" ? stock.rate : 0,
        availableQty:
          typeof stock?.availableQty === "number"
            ? stock.availableQty
            : 0,
        code: item.code ?? null,
      };
    });
 console.log("Items:", items);
 console.log("Stocks:", stocks);

    return NextResponse.json(results);
  } catch (err) {
    console.error("Item lookup error:", err);
    return NextResponse.json([], { status: 500 });
  }
 
}
