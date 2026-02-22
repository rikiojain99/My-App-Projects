import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import VendorSale from "@/models/VendorSale";
import Vendor from "@/models/Vendor";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    const {
      vendorId,
      vendorName,
      vendorMobile,
      items,
      deliveryPerson,
      grandTotal,
      discount,
      finalTotal,
      cashPaid,
    } = body;

    /* ================= VALIDATION ================= */

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Items required" },
        { status: 400 }
      );
    }

    if (finalTotal <= 0) {
      return NextResponse.json(
        { error: "Invalid total amount" },
        { status: 400 }
      );
    }

    if (cashPaid < 0) {
      return NextResponse.json(
        { error: "Invalid cash amount" },
        { status: 400 }
      );
    }

    if (cashPaid > finalTotal) {
      return NextResponse.json(
        { error: "Cash cannot exceed total" },
        { status: 400 }
      );
    }

    /* ================= FIND VENDOR ================= */

    let vendor;

    if (vendorId) {
      vendor = await Vendor.findById(vendorId.trim());
    }

    if (!vendor && vendorName) {
      vendor = await Vendor.findOne({ name: vendorName });

      if (!vendor) {
        vendor = await Vendor.create({
          name: vendorName,
          mobile: vendorMobile,
        });
      }
    }

    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor required" },
        { status: 400 }
      );
    }

    /* ================= CREDIT CALCULATION ================= */

    const creditAmount = finalTotal - cashPaid;

    /* ================= CREATE SALE ================= */

    const sale = await VendorSale.create({
      vendorId: vendor._id,
      items,
      deliveryPerson,
      grandTotal,
      discount,
      finalTotal,
      cashPaid,
      creditAmount,
      isPaid: creditAmount === 0,
    });

    /* ================= OPTIONAL: UPDATE VENDOR LEDGER ================= */

    await Vendor.findByIdAndUpdate(vendor._id, {
      $inc: {
        totalCredit: creditAmount,
      },
    });

    return NextResponse.json(sale, { status: 201 });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
