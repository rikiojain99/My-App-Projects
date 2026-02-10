import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Item from "@/models/Item";

export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    if (!search || search.trim().length < 1) {
      return NextResponse.json([]);
    }

    const items = await Item.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ],
    })
      .limit(10)
      .lean();

    return NextResponse.json(items);
  } catch (err) {
    console.error("Item search error:", err);
    return NextResponse.json([], { status: 500 });
  }
}
