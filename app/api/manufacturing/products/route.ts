import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Manufacturing from "@/models/Manufacturing";

/*
  PURPOSE:
  - Return unique manufactured product names
  - Used for Product Name suggestions
*/

export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    if (q.length < 2) {
      return NextResponse.json([]);
    }

    // Find distinct product names matching query
    const products = await Manufacturing.distinct("productName", {
      productName: { $regex: q, $options: "i" },
    });

    return NextResponse.json(products);
  } catch (err) {
    console.error("Manufacturing product lookup error", err);
    return NextResponse.json([], { status: 500 });
  }
}
