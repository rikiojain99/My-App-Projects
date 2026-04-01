import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import VendorSale from "@/models/VendorSale";
import Vendor from "@/models/Vendor";
import { getVendorOutstanding } from "@/lib/vendorBalance";

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") || 15), 1),
      50
    );
    const search = String(searchParams.get("search") || "").trim();
    const vendorId = String(searchParams.get("vendorId") || "").trim();
    const from = String(searchParams.get("from") || "").trim();
    const to = String(searchParams.get("to") || "").trim();

    const query: Record<string, any> = {};

    if (vendorId) {
      query.vendorId = vendorId;
    }

    if (from || to) {
      query.createdAt = {};

      if (from) {
        const fromDate = new Date(from);
        fromDate.setHours(0, 0, 0, 0);
        query.createdAt.$gte = fromDate;
      }

      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }

    if (search) {
      const regex = escapeRegex(search);
      const vendorMatches = await Vendor.find({
        $or: [
          { name: { $regex: regex, $options: "i" } },
          { mobile: { $regex: regex, $options: "i" } },
          { city: { $regex: regex, $options: "i" } },
        ],
      })
        .select("_id")
        .lean();

      const vendorIds = vendorMatches.map((vendor: any) => vendor._id);

      query.$or = [
        ...(vendorIds.length > 0 ? [{ vendorId: { $in: vendorIds } }] : []),
        { "items.name": { $regex: regex, $options: "i" } },
        { deliveredBy: { $regex: regex, $options: "i" } },
        { deliveryPerson: { $regex: regex, $options: "i" } },
      ];
    }

    const [sales, totalSales, totalAmountAgg] = await Promise.all([
      VendorSale.find(query)
        .populate("vendorId", "name mobile city")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      VendorSale.countDocuments(query),
      VendorSale.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$finalTotal" },
          },
        },
      ]),
    ]);

    const totalAmount = roundMoney(
      Number(totalAmountAgg?.[0]?.totalAmount || 0)
    );
    const totalPages = totalSales > 0 ? Math.ceil(totalSales / limit) : 1;

    const normalizedSales = sales.map((sale: any) => ({
      _id: String(sale._id),
      vendor: {
        _id: String(sale.vendorId?._id || sale.vendorId || ""),
        name: String(sale.vendorId?.name || "Unknown Vendor").trim(),
        mobile: String(sale.vendorId?.mobile || "").trim(),
        city: String(sale.vendorId?.city || "").trim(),
      },
      items: Array.isArray(sale.items)
        ? sale.items.map((item: any) => ({
            name: String(item?.name || "").trim(),
            qty: Number(item?.qty || 0),
            rate: Number(item?.rate || 0),
            total: Number(item?.total || 0),
          }))
        : [],
      deliveredBy: String(
        sale.deliveredBy || sale.deliveryPerson || ""
      ).trim(),
      grandTotal: Number(sale.grandTotal || 0),
      discount: Number(sale.discount || 0),
      finalTotal: Number(sale.finalTotal || 0),
      paymentType: sale.paymentType || "credit",
      paymentMethod: sale.paymentMethod || null,
      oldBalance: Number(sale.oldBalance || 0),
      newBalance: Number(sale.newBalance || 0),
      cashAmount: Number(sale.cashAmount || 0),
      upiAmount: Number(sale.upiAmount || 0),
      creditAmount: Number(sale.creditAmount || 0),
      createdAt: sale.createdAt,
    }));

    return NextResponse.json({
      sales: normalizedSales,
      totalSales,
      totalAmount,
      currentPage: page,
      totalPages,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch vendor sales" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    const {
      vendorId,
      vendorName,
      vendorMobile,
      city,
      items,
      deliveryPerson,
      deliveredBy,
      grandTotal,
      discount,
      finalTotal,
      cashPaid,
      paymentType,
      paymentMethod,
      cashAmount,
      upiAmount,
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
          city: city || "",
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

    const normalizedPaymentType =
      paymentType === "paid" ? "paid" : "credit";
    const normalizedPaymentMethod =
      normalizedPaymentType === "paid"
        ? paymentMethod || "cash"
        : null;
    const oldBalance = await getVendorOutstanding(vendor._id);
    const creditAmount =
      normalizedPaymentType === "credit"
        ? roundMoney(Number(finalTotal || 0))
        : roundMoney(Math.max(Number(finalTotal || 0) - Number(cashPaid || 0), 0));
    const newBalance = roundMoney(oldBalance + creditAmount);

    /* ================= CREATE SALE ================= */

    const sale = await VendorSale.create({
      vendorId: vendor._id,
      items,
      deliveryPerson: deliveredBy || deliveryPerson || "",
      deliveredBy: deliveredBy || deliveryPerson || "",
      grandTotal,
      discount,
      finalTotal,
      paymentType: normalizedPaymentType,
      paymentMethod: normalizedPaymentMethod,
      oldBalance,
      newBalance,
      cashAmount:
        normalizedPaymentType === "paid"
          ? Number(cashAmount ?? cashPaid ?? finalTotal)
          : 0,
      upiAmount:
        normalizedPaymentType === "paid"
          ? Number(upiAmount ?? 0)
          : 0,
      cashPaid: Number(cashPaid || 0),
      creditAmount,
      isPaid: normalizedPaymentType === "paid",
    });

    /* ================= OPTIONAL: UPDATE VENDOR LEDGER ================= */

    await Vendor.findByIdAndUpdate(vendor._id, {
      $set: {
        city:
          typeof city === "string" ? city.trim() : vendor.city || "",
        mobile:
          typeof vendorMobile === "string" &&
          vendorMobile.trim().length > 0
            ? vendorMobile.trim()
            : vendor.mobile,
        balance: newBalance,
      },
      $inc: { totalCredit: creditAmount },
    });

    return NextResponse.json(sale, { status: 201 });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
