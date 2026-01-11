import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bill from "@/models/Bill";
import Customer from "@/models/Customer";
import Item from "@/models/Item";
import ItemStock from "@/models/ItemStock";

const DELETE_PASSCODE = process.env.DELETE_PASSCODE || "1234";

/* =====================================================
   CREATE BILL (DEDUCT STOCK)
===================================================== */
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

    // 2. Ensure enough stock BEFORE deduction
    for (const it of items) {
      const stock = await ItemStock.findOne({ itemName: it.name });
      if (!stock || stock.availableQty < it.qty) {
        return NextResponse.json(
          { error: `Insufficient stock for ${it.name}` },
          { status: 400 }
        );
      }
    }

    // 3. Deduct stock
    for (const it of items) {
      await ItemStock.findOneAndUpdate(
        { itemName: it.name },
        {
          $inc: { availableQty: -it.qty },
          $set: { lastUpdated: new Date() },
        }
      );
    }

    // 4. Ensure item names exist (for suggestions)
    for (const it of items) {
      await Item.updateOne(
        { name: it.name },
        { $setOnInsert: { name: it.name } },
        { upsert: true }
      );
    }

    // 5. Create bill
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

/* =====================================================
   GET BILLS
===================================================== */
export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;

  const bills = await Bill.find({})
    .populate("customerId")
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

/* =====================================================
   UPDATE BILL (RESTORE → DEDUCT)
===================================================== */
export async function PUT(req: Request) {
  await dbConnect();
  const data = await req.json();

  // ---------- RESTORE DELETED BILL ----------
  if (data.restore && data.billId) {
    const bill = await Bill.findById(data.billId);
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // Deduct stock again
    for (const it of bill.items) {
      const stock = await ItemStock.findOne({ itemName: it.name });
      if (!stock || stock.availableQty < it.qty) {
        return NextResponse.json(
          { error: `Insufficient stock for ${it.name}` },
          { status: 400 }
        );
      }
    }

    for (const it of bill.items) {
      await ItemStock.findOneAndUpdate(
        { itemName: it.name },
        { $inc: { availableQty: -it.qty } }
      );
    }

    bill.deleted = false;
    await bill.save();

    return NextResponse.json({ success: true, bill });
  }

  // ---------- UPDATE BILL ----------
  try {
    const { billId, updates, customerUpdates } = data;

    const oldBill = await Bill.findById(billId);
    if (!oldBill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // 1. Restore old stock
    for (const it of oldBill.items) {
      await ItemStock.findOneAndUpdate(
        { itemName: it.name },
        { $inc: { availableQty: it.qty } }
      );
    }

    // 2. Check new stock availability
    for (const it of updates.items) {
      const stock = await ItemStock.findOne({ itemName: it.name });
      if (!stock || stock.availableQty < it.qty) {
        return NextResponse.json(
          { error: `Insufficient stock for ${it.name}` },
          { status: 400 }
        );
      }
    }

    // 3. Deduct new stock
    for (const it of updates.items) {
      await ItemStock.findOneAndUpdate(
        { itemName: it.name },
        { $inc: { availableQty: -it.qty } }
      );
    }

    // 4. Update bill
    const updatedBill = await Bill.findByIdAndUpdate(
      billId,
      updates,
      { new: true }
    ).populate("customerId");

    if (customerUpdates) {
      await Customer.findByIdAndUpdate(
        updatedBill!.customerId,
        customerUpdates
      );
    }

    return NextResponse.json(updatedBill, { status: 200 });
  } catch (err: any) {
    console.error("Bill update failed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

/* =====================================================
   DELETE BILL (RESTORE STOCK)
===================================================== */
export async function DELETE(req: Request) {
  await dbConnect();
  const { billId, passcode } = await req.json();

  if (passcode !== DELETE_PASSCODE) {
    return NextResponse.json({ error: "Invalid passcode" }, { status: 403 });
  }

  const bill = await Bill.findById(billId);
  if (!bill) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  // Restore stock
  for (const it of bill.items) {
    await ItemStock.findOneAndUpdate(
      { itemName: it.name },
      { $inc: { availableQty: it.qty } }
    );
  }

  bill.deleted = true;
  await bill.save();

  return NextResponse.json({ success: true, bill });
}
