import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import DailySale from "@/models/DailySale";
import Bill from "@/models/Bill";
import Customer from "@/models/Customer";
import { getBusinessDateKey } from "@/lib/date/getBusinessDateKey";

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export async function POST() {
  try {
    await dbConnect();

    const today = getBusinessDateKey();

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

    const itemMap: Record<
      string,
      {
        name: string;
        qty: number;
        total: number;
      }
    > = {};

    dailySale.transactions.forEach((entry: any) => {
      entry.items.forEach((item: any) => {
        const name = String(item?.name || "").trim();
        const qty = Number(item?.qty || 0);
        const total = roundMoney(
          Number(item?.total ?? qty * Number(item?.rate || 0))
        );

        if (!name || !Number.isFinite(qty) || qty <= 0) {
          return;
        }

        if (!itemMap[name]) {
          itemMap[name] = {
            name,
            qty: 0,
            total: 0,
          };
        }

        itemMap[name].qty += qty;
        itemMap[name].total = roundMoney(
          itemMap[name].total + total
        );
      });
    });

    const mergedItems = Object.values(itemMap).map((item) => {
      const qty = roundMoney(item.qty);
      const total = roundMoney(item.total);

      return {
        name: item.name,
        qty,
        rate: qty > 0 ? roundMoney(total / qty) : 0,
        total,
      };
    });

    const mergedGrandTotal = roundMoney(
      mergedItems.reduce(
        (sum, item) => sum + Number(item.total || 0),
        0
      )
    );
    const finalTotal = roundMoney(
      Number(dailySale.totalRevenue || 0)
    );
    const discount = Math.max(
      roundMoney(mergedGrandTotal - finalTotal),
      0
    );
    const totalCash = roundMoney(
      Number(dailySale.totalCash || 0)
    );
    const totalUpi = roundMoney(
      Number(dailySale.totalUpi || 0)
    );

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

    let bill: any;

    try {
      bill = await Bill.create({
        billNo,
        customerId: customer._id,
        items: mergedItems,
        grandTotal: mergedGrandTotal,
        discount,
        finalTotal,
        paymentMode: "split",
        cashAmount: totalCash,
        upiAmount: totalUpi,
        upiId: null,
        upiAccount: null,
        isFastBill: true,
      });
    } catch (err: any) {
      const duplicateBillNo =
        err?.code === 11000 ||
        String(err?.message || "").includes("E11000");

      if (!duplicateBillNo) {
        throw err;
      }

      const existingBill = await Bill.findOne({ billNo });
      if (!existingBill) {
        throw err;
      }

      bill = existingBill;
    }

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
