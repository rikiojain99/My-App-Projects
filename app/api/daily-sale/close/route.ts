import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import DailySale from "@/models/DailySale";
import Bill from "@/models/Bill";
import Customer from "@/models/Customer";

export async function POST() {
  try {
    await dbConnect();

    const today = new Date().toISOString().slice(0, 10);

    const dailySale = await DailySale.findOne({
      date: today,
      isClosed: false,
    });

    if (!dailySale) {
      return NextResponse.json(
        { error: "No open daily sale found" },
        { status: 404 }
      );
    }

    /* ================= MERGE ITEMS ================= */

    const itemMap: Record<string, any> = {};

    dailySale.transactions.forEach((entry: any) => {
      entry.items.forEach((item: any) => {
        if (!itemMap[item.name]) {
          itemMap[item.name] = {
            name: item.name,
            qty: 0,
            rate: item.rate,
            total: 0,
          };
        }

        itemMap[item.name].qty += item.qty;
        itemMap[item.name].total += item.total;
      });
    });

    const mergedItems = Object.values(itemMap);

    /* ================= WALK-IN CUSTOMER ================= */

    let customer = await Customer.findOne({
      mobile: "FAST-SALE",
    });

    if (!customer) {
      customer = await Customer.create({
        name: "Walk-in Customer",
        mobile: "FAST-SALE",
        city: "",
        type: "FAST",
      });
    }

    const billNo = `FAST-${today.replace(/-/g, "")}`;

    const bill = await Bill.create({
      billNo,
      customerId: customer._id,
      items: mergedItems,
      grandTotal: dailySale.totalRevenue,
      discount: 0,
      finalTotal: dailySale.totalRevenue,
      paymentMode: "split",
      cashAmount: dailySale.totalCash,
      upiAmount: dailySale.totalUpi,
      upiId: null,
      upiAccount: null,
      isFastBill: true,
    });

    dailySale.isClosed = true;
    dailySale.convertedBillId = bill._id;

    await dailySale.save();

    return NextResponse.json({
      message: "Day closed successfully",
      bill,
    });

  } catch (err: any) {
    console.error("Close day failed:", err.message);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
