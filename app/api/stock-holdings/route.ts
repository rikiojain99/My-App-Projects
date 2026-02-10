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
