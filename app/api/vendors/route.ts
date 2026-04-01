import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Vendor from "@/models/Vendor";
import { getVendorOutstandingMap } from "@/lib/vendorBalance";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const enrichVendors = async (vendors: any[]) => {
  const vendorIds = vendors.map((vendor) => String(vendor._id));
  const outstandingMap = await getVendorOutstandingMap(vendorIds);

  return vendors.map((vendor) => {
    const vendorId = String(vendor._id);
    const outstanding = outstandingMap.get(vendorId);

    return {
      ...vendor,
      balance:
        typeof outstanding === "number"
          ? outstanding
          : Number(vendor.balance || 0),
    };
  });
};

export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const search = String(searchParams.get("search") || "").trim();
  const mobile = String(searchParams.get("mobile") || "").trim();
  const recent = searchParams.get("recent") === "1";
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit") || 8), 1),
    20
  );

  if (mobile) {
    const vendor = await Vendor.findOne({ mobile })
      .select("_id name mobile city balance createdAt updatedAt")
      .lean();

    if (!vendor) {
      return NextResponse.json(null);
    }

    const [enrichedVendor] = await enrichVendors([vendor]);
    return NextResponse.json(enrichedVendor || null);
  }

  if (search) {
    const regex = escapeRegex(search);
    const vendors = await Vendor.find({
      $or: [
        { name: { $regex: regex, $options: "i" } },
        { mobile: { $regex: regex, $options: "i" } },
      ],
    })
      .select("_id name mobile city balance createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(await enrichVendors(vendors));
  }

  const vendors = await Vendor.find()
    .select("_id name mobile city balance createdAt updatedAt")
    .sort(recent ? { updatedAt: -1 } : { createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json(await enrichVendors(vendors));
}
