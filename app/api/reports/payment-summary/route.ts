import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bill from "@/models/Bill";

export async function GET() {
  await dbConnect();

  const result = await Bill.aggregate([
    { $match: { deleted: false } },
    {
      $group: {
        _id: "$paymentMode",
        total: { $sum: "$finalTotal" },
        count: { $sum: 1 },
        cashTotal: { $sum: "$cashAmount" },
        upiTotal: { $sum: "$upiAmount" },
      },
    },
  ]);

  const summary = {
    cash: { total: 0, count: 0 },
    upi: { total: 0, count: 0 },
    split: { total: 0, count: 0 },
  };

  result.forEach((r) => {
    if (r._id === "cash") {
      summary.cash = {
        total: r.total || 0,
        count: r.count || 0,
      };
    }

    if (r._id === "upi") {
      summary.upi = {
        total: r.total || 0,
        count: r.count || 0,
      };
    }

    if (r._id === "split") {
      summary.split = {
        total: r.total || 0,
        count: r.count || 0,
      };
    }
  });

  return NextResponse.json(summary);
}
