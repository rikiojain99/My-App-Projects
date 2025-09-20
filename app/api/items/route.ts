import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Item from "@/models/Item";

export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim();

  // Only search if 3 or more characters
  if (!search || search.length < 3) return NextResponse.json([], { status: 200 });

  try {
    const items = await Item.find({
      name: { $regex: search, $options: "i" }, // case-insensitive match
    })
      .limit(10)
      .select("_id name"); // only return _id and name

    return NextResponse.json(items, { status: 200 });
  } catch (err) {
    console.error("Item search failed:", err);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}
