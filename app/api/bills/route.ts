import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bill from "@/models/Bill";
import Customer from "@/models/Customer";
import Item from "@/models/Item";

const DELETE_PASSCODE = process.env.DELETE_PASSCODE || "1234"; 

// ✅ Create Bill
export async function POST(req: Request) {
  try {
    await dbConnect();
    const { mobile, items, grandTotal, billNo } = await req.json();

    // 1. Find customer
    const customer = await Customer.findOne({ mobile });
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // 2. Ensure items exist in DB
    const billItems = [];
    for (const it of items) {
      let existing = await Item.findOne({ name: it.name });
      if (!existing) {
        existing = await Item.create({ name: it.name, rate: it.rate });
      }
      billItems.push({
        itemId: existing._id,
        qty: it.qty,
        rate: it.rate,
        total: it.total,
      });
    }

    // 3. Create Bill
  const bill = await Bill.create({
      billNo,
      customerId: customer._id,
      items: items.map((i: any) => ({
        name: i.name,
        qty: i.qty,
        rate: i.rate,
        total: i.total,
      })),
      grandTotal,
    });

    return NextResponse.json(bill, { status: 201 });
  } catch (err: any) {
    console.error("Bill save failed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// ✅ Get Bills (with customer + items populated)
export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;

  const bills = await Bill.find({})
    .populate("customerId")
    .populate("items.itemId")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalBills = await Bill.countDocuments();

  return NextResponse.json({
    bills,
    totalBills,
    totalPages: Math.ceil(totalBills / limit),
    currentPage: page,
  });
}

// ✅ Update Bill + Customer
export async function PUT(req: Request) {
  await dbConnect();
  const data = await req.json();

  if (data.restore && data.billId) {
    const bill = await Bill.findByIdAndUpdate(
      data.billId,
      { deleted: false },
      { new: true }
    );
    if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    return NextResponse.json({ success: true, bill });
  }

  try {
    const { billId, updates, customerUpdates } = data;

    const updatedBill = await Bill.findByIdAndUpdate(billId, updates, {
      new: true,
    }).populate("customerId items.itemId");

    if (!updatedBill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    if (customerUpdates) {
      await Customer.findByIdAndUpdate(updatedBill.customerId, customerUpdates);
    }

    const refreshedBill = await Bill.findById(updatedBill._id)
      .populate("customerId")
      .populate("items.itemId");

    return NextResponse.json(refreshedBill, { status: 200 });
  } catch (err: any) {
    console.error("Bill update failed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// ✅ Soft Delete
export async function DELETE(req: Request) {
  await dbConnect();
  const { billId, passcode } = await req.json();

  if (passcode !== DELETE_PASSCODE) {
    return NextResponse.json({ error: "Invalid passcode" }, { status: 403 });
  }

  const bill = await Bill.findByIdAndUpdate(
    billId,
    { deleted: true },
    { new: true }
  );
  if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });

  return NextResponse.json({ success: true, bill });
}
