import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bill from "@/models/Bill";

export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  if (q.length < 3) {
    return NextResponse.json([]); // only start after 3 chars
  }

  // Find distinct item names containing the query
  const items = await Bill.aggregate([
    { $unwind: "$items" },
    { $match: { "items.name": { $regex: q, $options: "i" } } },
    { $group: { _id: "$items.name" } },
    { $limit: 10 }, // limit suggestions
  ]);

  return NextResponse.json(items.map((i) => i._id));
}
