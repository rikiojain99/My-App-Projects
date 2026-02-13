import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { createBill } from "@/lib/billing/createBill";

import Bill from "@/models/Bill";
import Customer from "@/models/Customer";
import ItemStock from "@/models/ItemStock";

/* =====================================================
   CREATE BILL
===================================================== */
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    const bill = await createBill(body);

    return NextResponse.json(bill, { status: 201 });
  } catch (err: any) {
    console.error("Bill save failed:", err.message);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

/* =====================================================
   GET BILLS (SMART SEARCH + MOBILE + DATE + PAGINATION)
===================================================== */
export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "15");
  const skip = (page - 1) * limit;

  const search = searchParams.get("search") || "";
  const mobile = searchParams.get("mobile");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query: any = { deleted: false };

  /* =====================================================
     1️⃣ MOBILE FILTER (FOR PREVIOUS BILLS MODAL)
  ===================================================== */
  if (mobile && mobile.trim().length === 10) {
    const customer = await Customer.findOne({
      mobile: mobile.trim(),
    });

    if (!customer) {
      return NextResponse.json({ bills: [] });
    }

    const bills = await Bill.find({
      customerId: customer._id,
      deleted: false,
    })
      .populate("customerId")
      .sort({ createdAt: -1 })
      .limit(10);

    return NextResponse.json({ bills });
  }

  /* =====================================================
     2️⃣ SMART SEARCH (DASHBOARD SEARCH)
  ===================================================== */
  if (search && search.length >= 3) {
    // First find matching customers
    const customers = await Customer.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
      ],
    }).select("_id");

    const customerIds = customers.map((c) => c._id);

    query.customerId = { $in: customerIds };
  }

  /* =====================================================
     3️⃣ DATE FILTER
  ===================================================== */
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);
  }

  /* =====================================================
     4️⃣ PAGINATION
  ===================================================== */
  const bills = await Bill.find(query)
    .populate("customerId")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalBills = await Bill.countDocuments(query);

  return NextResponse.json({
    bills,
    totalPages: Math.ceil(totalBills / limit),
    currentPage: page,
  });
}

/* =====================================================
   UPDATE BILL (WITH PAYMENT EDIT SUPPORT)
===================================================== */
export async function PUT(req: Request) {
  await dbConnect();
  const data = await req.json();

  const { billId, updates, customerUpdates } = data;

  const oldBill = await Bill.findById(billId);
  if (!oldBill) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  /* ================= RESTORE OLD STOCK ================= */
  for (const it of oldBill.items) {
    await ItemStock.findOneAndUpdate(
      { itemName: it.name },
      { $inc: { availableQty: it.qty } }
    );
  }

  /* ================= DEDUCT NEW STOCK ================= */
  for (const it of updates.items) {
    const stock = await ItemStock.findOne({ itemName: it.name });

    if (stock && stock.availableQty > 0 && stock.availableQty < it.qty) {
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

  /* ================= UPDATE BILL ================= */
  const updatedBill = await Bill.findByIdAndUpdate(
    billId,
    {
      ...updates,
      paymentMode: updates.paymentMode,
      cashAmount: updates.cashAmount,
      upiAmount: updates.upiAmount,
      upiId: updates.upiId,
      upiAccount: updates.upiAccount,
    },
    { new: true }
  ).populate("customerId");

  if (customerUpdates) {
    await Customer.findByIdAndUpdate(
      updatedBill!.customerId,
      customerUpdates
    );
  }

  return NextResponse.json(updatedBill);
}
