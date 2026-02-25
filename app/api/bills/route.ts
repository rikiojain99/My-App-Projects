import { NextResponse } from "next/server";
import mongoose, { type ClientSession } from "mongoose";
import dbConnect from "@/lib/mongodb";
import { createBill } from "@/lib/billing/createBill";

import Bill from "@/models/Bill";
import Customer from "@/models/Customer";
import ItemStock from "@/models/ItemStock";

const isTransactionUnsupported = (err: any) => {
  const msg = String(err?.message || "");
  return (
    msg.includes("Transaction numbers are only allowed") ||
    msg.includes("replica set member or mongos")
  );
};

const errorResponse = (err: any) => {
  const message = String(err?.message || "Something went wrong");
  let status = 500;

  if (message.includes("Insufficient stock")) status = 400;
  else if (message.includes("not found")) status = 404;
  else if (
    message.includes("duplicate key") ||
    message.includes("E11000")
  ) {
    status = 409;
  }

  return NextResponse.json({ error: message }, { status });
};

const aggregateItemQty = (
  items: Array<{ name: string; qty: number }>
) => {
  const map: Record<string, number> = {};
  for (const item of items || []) {
    const name = (item?.name || "").trim();
    if (!name) continue;
    map[name] = (map[name] || 0) + Number(item.qty || 0);
  }
  return map;
};

async function applyBillUpdateWithStockSync({
  billId,
  updates,
  customerUpdates,
  session,
}: {
  billId: string;
  updates: any;
  customerUpdates?: any;
  session?: ClientSession;
}) {
  const oldBillQuery = Bill.findById(billId);
  if (session) oldBillQuery.session(session);
  const oldBill = await oldBillQuery;

  if (!oldBill) {
    throw new Error("Bill not found");
  }

  const oldQtyMap = aggregateItemQty(oldBill.items || []);
  const newQtyMap = aggregateItemQty(updates?.items || []);
  const itemNames = new Set([
    ...Object.keys(oldQtyMap),
    ...Object.keys(newQtyMap),
  ]);

  for (const itemName of itemNames) {
    const oldQty = oldQtyMap[itemName] || 0;
    const newQty = newQtyMap[itemName] || 0;
    const delta = newQty - oldQty;

    if (delta === 0) continue;

    const stockQuery = ItemStock.findOne({ itemName });
    if (session) stockQuery.session(session);
    const stock = await stockQuery;

    if (delta > 0) {
      if (
        stock &&
        stock.availableQty > 0 &&
        stock.availableQty < delta
      ) {
        throw new Error(`Insufficient stock for ${itemName}`);
      }

      if (stock && stock.availableQty > 0) {
        await ItemStock.updateOne(
          { itemName },
          {
            $inc: { availableQty: -delta },
            $set: { lastUpdated: new Date() },
          },
          { session }
        );
      }
    } else {
      if (stock) {
        await ItemStock.updateOne(
          { itemName },
          {
            $inc: { availableQty: Math.abs(delta) },
            $set: { lastUpdated: new Date() },
          },
          { session }
        );
      }
    }
  }

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
    { new: true, session }
  );

  if (!updatedBill) {
    throw new Error("Bill not found");
  }

  if (customerUpdates) {
    await Customer.findByIdAndUpdate(
      updatedBill.customerId,
      customerUpdates,
      { session }
    );
  }

  return updatedBill;
}

/* =====================================================
   CREATE BILL
===================================================== */
export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();

  const session = await mongoose.startSession();
  try {
    let createdBill: any = null;

    await session.withTransaction(async () => {
      createdBill = await createBill(body, session);
    });

    if (!createdBill) {
      throw new Error("Bill create failed");
    }

    return NextResponse.json(createdBill, { status: 201 });
  } catch (err: any) {
    if (isTransactionUnsupported(err)) {
      const createdBill = await createBill(body);
      return NextResponse.json(createdBill, { status: 201 });
    }
    return errorResponse(err);
  } finally {
    session.endSession();
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

  const query: any = { deleted: false };

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

  if (search && search.length >= 3) {
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

  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

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
    totalBills,
  });
}

/* =====================================================
   UPDATE BILL (ATOMIC STOCK + BILL UPDATE)
===================================================== */
export async function PUT(req: Request) {
  await dbConnect();
  const data = await req.json();
  const { billId, updates, customerUpdates } = data;

  const session = await mongoose.startSession();
  try {
    let updatedBillId = "";

    await session.withTransaction(async () => {
      const updatedBill = await applyBillUpdateWithStockSync({
        billId,
        updates,
        customerUpdates,
        session,
      });

      updatedBillId = String(updatedBill._id);
    });

    if (!updatedBillId) {
      throw new Error("Bill not found");
    }

    const result = await Bill.findById(updatedBillId).populate(
      "customerId"
    );

    return NextResponse.json(result);
  } catch (err: any) {
    if (isTransactionUnsupported(err)) {
      const updatedBill = await applyBillUpdateWithStockSync({
        billId,
        updates,
        customerUpdates,
      });
      const result = await Bill.findById(updatedBill._id).populate(
        "customerId"
      );
      return NextResponse.json(result);
    }
    return errorResponse(err);
  } finally {
    session.endSession();
  }
}
