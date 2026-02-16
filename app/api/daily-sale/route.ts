import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import DailySale from "@/models/DailySale";
import ItemStock from "@/models/ItemStock";

/* =====================================================
   CREATE FAST BILL ENTRY
===================================================== */

export async function POST(req: Request) {
  try {
    await dbConnect();

    const {
      items,
      total,
      paymentMode,
      cashAmount = 0,
      upiAmount = 0,
    } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Items required" },
        { status: 400 }
      );
    }

    if (isNaN(total)) {
      return NextResponse.json(
        { error: "Invalid total amount" },
        { status: 400 }
      );
    }

    /* ================= STOCK DEDUCT ================= */

    for (const it of items) {
      const stock = await ItemStock.findOne({
        itemName: it.name,
      });

      if (
        stock &&
        stock.availableQty > 0 &&
        stock.availableQty < it.qty
      ) {
        return NextResponse.json(
          { error: `Insufficient stock for ${it.name}` },
          { status: 400 }
        );
      }

      if (stock && stock.availableQty > 0) {
        await ItemStock.findOneAndUpdate(
          { itemName: it.name },
          { $inc: { availableQty: -it.qty } }
        );
      }
    }

    const today = new Date().toISOString().slice(0, 10);

    /* ================= FIND OR CREATE TODAY ================= */

    let dailySale = await DailySale.findOne({ date: today });

    if (!dailySale) {
      dailySale = await DailySale.create({
        date: today,
        transactions: [],
        totalRevenue: 0,
        totalCash: 0,
        totalUpi: 0,
      });
    }

    /* ================= SAFE PUSH ================= */

    dailySale.transactions = dailySale.transactions || [];

    dailySale.transactions.push({
      items,
      total: Number(total),
      paymentMode,
      cashAmount: Number(cashAmount),
      upiAmount: Number(upiAmount),
      createdAt: new Date(),
    });

    dailySale.totalRevenue += Number(total);
    dailySale.totalCash += Number(cashAmount);
    dailySale.totalUpi += Number(upiAmount);

    await dailySale.save();

    return NextResponse.json(
      { success: true },
      { status: 201 }
    );

  } catch (err: any) {
    console.error("Daily sale failed:", err.message);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

/* =====================================================
   GET TODAY SUMMARY
===================================================== */
export async function GET() {
  try {
    await dbConnect();

    const today = new Date().toISOString().split("T")[0];

    const dailySale = await DailySale.findOne({ date: today });

    if (!dailySale) {
      return NextResponse.json({
        entries: [],
        totalAmount: 0,
        totalCash: 0,
        totalUpi: 0,
        isClosed: false,
      });
    }

    // ✅ NORMALIZE FIELDS (support old data)
    return NextResponse.json({
      ...dailySale.toObject(),
      totalAmount:
        dailySale.totalAmount ??
        dailySale.totalRevenue ??
        0,
      totalCash: dailySale.totalCash ?? 0,
      totalUpi: dailySale.totalUpi ?? 0,
    });

  } catch (err: any) {
    console.error("Daily sale fetch failed:", err.message);

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
