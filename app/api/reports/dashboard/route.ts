import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bill from "@/models/Bill";

export async function GET() {
  await dbConnect();

  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const startOfWeek = new Date();
  startOfWeek.setDate(now.getDate() - 7);

  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const result = await Bill.aggregate([
    { $match: { deleted: false } },
    {
      $facet: {
        today: [
          { $match: { createdAt: { $gte: startOfToday } } },
          {
            $group: {
              _id: null,
              total: { $sum: "$finalTotal" },
              count: { $sum: 1 },
            },
          },
        ],
        week: [
          { $match: { createdAt: { $gte: startOfWeek } } },
          {
            $group: {
              _id: null,
              total: { $sum: "$finalTotal" },
              count: { $sum: 1 },
            },
          },
        ],
        month: [
          { $match: { createdAt: { $gte: startOfMonth } } },
          {
            $group: {
              _id: null,
              total: { $sum: "$finalTotal" },
              count: { $sum: 1 },
            },
          },
        ],
        overall: [
          {
            $group: {
              _id: null,
              total: { $sum: "$finalTotal" },
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  const format = (data: any[]) =>
    data[0] || { total: 0, count: 0 };

  return NextResponse.json({
    today: format(result[0].today),
    week: format(result[0].week),
    month: format(result[0].month),
    overall: format(result[0].overall),
  });
}
