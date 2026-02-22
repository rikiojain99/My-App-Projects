import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Vendor from "@/models/Vendor";

export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const mobile = searchParams.get("mobile");

  if (mobile) {
    const vendor = await Vendor.findOne({ mobile });
    return NextResponse.json(vendor || null);
  }

  if (search) {
    const vendors = await Vendor.find({
      name: { $regex: search, $options: "i" },
    }).limit(10);

    return NextResponse.json(vendors);
  }

  const vendors = await Vendor.find().limit(20);
  return NextResponse.json(vendors);
}
