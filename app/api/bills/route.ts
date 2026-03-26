import { NextResponse } from "next/server";
import mongoose, { type ClientSession } from "mongoose";
import dbConnect from "@/lib/mongodb";
import { createBill } from "@/lib/billing/createBill";

import Bill from "@/models/Bill";
import Customer from "@/models/Customer";
import ItemStock from "@/models/ItemStock";

type PaymentMode = "cash" | "upi" | "split";

type NormalizedBillItem = {
  name: string;
  qty: number;
  rate: number;
  total: number;
};

type NormalizedCreateBillBody = {
  billNo: string;
  mobile: string;
  customer?: {
    name: string;
    type: string;
    city: string;
  };
  items: NormalizedBillItem[];
  grandTotal: number;
  discount: number;
  finalTotal: number;
  paymentMode: PaymentMode;
  cashAmount: number;
  upiAmount: number;
  upiId: string | null;
  upiAccount: string | null;
};

type NormalizedUpdatePayload = {
  billId: string;
  updates: {
    items: NormalizedBillItem[];
    grandTotal: number;
    discount: number;
    finalTotal: number;
    paymentMode: PaymentMode;
    cashAmount: number;
    upiAmount: number;
    upiId: string | null;
    upiAccount: string | null;
  };
  customerUpdates?: {
    name?: string;
    mobile?: string;
    city?: string;
    type?: string;
  };
};

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const isSameAmount = (a: number, b: number) =>
  Math.abs(roundMoney(a) - roundMoney(b)) < 0.01;

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeItems = (rawItems: any): NormalizedBillItem[] => {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error("Items required");
  }

  return rawItems.map((item, index) => {
    const name = String(item?.name || "").trim();
    const qty = Number(item?.qty);
    const rate = Number(item?.rate);

    if (!name) {
      throw new Error(`Invalid item name at row ${index + 1}`);
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error(`Invalid qty for ${name}`);
    }
    if (!Number.isFinite(rate) || rate < 0) {
      throw new Error(`Invalid rate for ${name}`);
    }

    return {
      name,
      qty,
      rate,
      total: roundMoney(qty * rate),
    };
  });
};

const normalizePayment = ({
  paymentMode,
  cashAmount,
  upiAmount,
  finalTotal,
  upiId,
  upiAccount,
}: {
  paymentMode: any;
  cashAmount: any;
  upiAmount: any;
  finalTotal: number;
  upiId: any;
  upiAccount: any;
}) => {
  const mode = String(paymentMode || "").trim() as PaymentMode;
  const cash = roundMoney(Number(cashAmount ?? 0));
  const upi = roundMoney(Number(upiAmount ?? 0));
  const normalizedUpiId = String(upiId || "").trim() || null;
  const normalizedUpiAccount =
    String(upiAccount || "").trim() || null;

  if (!["cash", "upi", "split"].includes(mode)) {
    throw new Error("Invalid payment mode");
  }

  if (!Number.isFinite(cash) || !Number.isFinite(upi) || cash < 0 || upi < 0) {
    throw new Error("Invalid payment amount");
  }

  if (mode === "cash") {
    if (!isSameAmount(cash, finalTotal) || upi !== 0) {
      throw new Error("Payment mismatch");
    }
  }

  if (mode === "upi") {
    if (!isSameAmount(upi, finalTotal) || cash !== 0 || !normalizedUpiAccount) {
      throw new Error("Payment mismatch");
    }
  }

  if (mode === "split") {
    if (!isSameAmount(cash + upi, finalTotal)) {
      throw new Error("Payment mismatch");
    }
    if (upi > 0 && !normalizedUpiAccount) {
      throw new Error("UPI account required");
    }
  }

  return {
    paymentMode: mode,
    cashAmount: cash,
    upiAmount: upi,
    upiId: normalizedUpiId,
    upiAccount: normalizedUpiAccount,
  };
};

const normalizeCreateBillBody = (body: any): NormalizedCreateBillBody => {
  const billNo = String(body?.billNo || "").trim();
  const mobile = String(body?.mobile || "").trim();
  const customerName = String(body?.customer?.name || "").trim();
  const customerType = String(body?.customer?.type || "").trim();
  const customerCity = String(body?.customer?.city || "").trim();

  if (!billNo) {
    throw new Error("Bill number required");
  }
  if (!/^\d{10}$/.test(mobile)) {
    throw new Error("Valid customer mobile required");
  }
  if (
    body?.customer !== undefined &&
    (!customerName || !customerType)
  ) {
    throw new Error("Customer name and type are required");
  }

  const items = normalizeItems(body?.items);
  const computedGrandTotal = roundMoney(
    items.reduce((sum, item) => sum + item.total, 0)
  );

  if (computedGrandTotal <= 0) {
    throw new Error("Invalid total amount");
  }

  const discountInput = Number(body?.discount ?? 0);
  if (!Number.isFinite(discountInput) || discountInput < 0) {
    throw new Error("Invalid discount");
  }
  const discount = Math.min(roundMoney(discountInput), computedGrandTotal);
  const finalTotal = roundMoney(
    Math.max(computedGrandTotal - discount, 0)
  );

  if (
    body?.grandTotal !== undefined &&
    !isSameAmount(Number(body.grandTotal), computedGrandTotal)
  ) {
    throw new Error("Grand total mismatch");
  }

  if (
    body?.finalTotal !== undefined &&
    !isSameAmount(Number(body.finalTotal), finalTotal)
  ) {
    throw new Error("Final total mismatch");
  }

  const payment = normalizePayment({
    paymentMode: body?.paymentMode,
    cashAmount: body?.cashAmount,
    upiAmount: body?.upiAmount,
    finalTotal,
    upiId: body?.upiId,
    upiAccount: body?.upiAccount,
  });

  return {
    billNo,
    mobile,
    customer:
      body?.customer !== undefined
        ? {
            name: customerName,
            type: customerType,
            city: customerCity,
          }
        : undefined,
    items,
    grandTotal: computedGrandTotal,
    discount,
    finalTotal,
    ...payment,
  };
};

const normalizeUpdatePayload = (data: any): NormalizedUpdatePayload => {
  const billId = String(data?.billId || "").trim();
  if (!billId) {
    throw new Error("Bill ID required");
  }

  const updates = data?.updates || {};
  const items = normalizeItems(updates.items);
  const computedGrandTotal = roundMoney(
    items.reduce((sum, item) => sum + item.total, 0)
  );

  const discountInput = Number(updates?.discount ?? 0);
  if (!Number.isFinite(discountInput) || discountInput < 0) {
    throw new Error("Invalid discount");
  }
  const discount = Math.min(roundMoney(discountInput), computedGrandTotal);
  const finalTotal = roundMoney(
    Math.max(computedGrandTotal - discount, 0)
  );

  if (
    updates?.grandTotal !== undefined &&
    !isSameAmount(Number(updates.grandTotal), computedGrandTotal)
  ) {
    throw new Error("Grand total mismatch");
  }

  if (
    updates?.finalTotal !== undefined &&
    !isSameAmount(Number(updates.finalTotal), finalTotal)
  ) {
    throw new Error("Final total mismatch");
  }

  const payment = normalizePayment({
    paymentMode: updates?.paymentMode,
    cashAmount: updates?.cashAmount,
    upiAmount: updates?.upiAmount,
    finalTotal,
    upiId: updates?.upiId,
    upiAccount: updates?.upiAccount,
  });

  const rawCustomerUpdates = data?.customerUpdates || {};
  const customerUpdates: Record<string, string> = {};

  for (const key of ["name", "city", "type"] as const) {
    if (rawCustomerUpdates[key] !== undefined) {
      customerUpdates[key] = String(rawCustomerUpdates[key]).trim();
    }
  }

  if (rawCustomerUpdates.mobile !== undefined) {
    const normalizedMobile = String(rawCustomerUpdates.mobile).trim();
    if (
      normalizedMobile &&
      !/^\d{10}$/.test(normalizedMobile) &&
      normalizedMobile !== "FAST-SALE"
    ) {
      throw new Error("Invalid customer mobile");
    }
    customerUpdates.mobile = normalizedMobile;
  }

  return {
    billId,
    updates: {
      items,
      grandTotal: computedGrandTotal,
      discount,
      finalTotal,
      ...payment,
    },
    customerUpdates:
      Object.keys(customerUpdates).length > 0
        ? customerUpdates
        : undefined,
  };
};

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
    message.includes("Invalid") ||
    message.includes("required") ||
    message.includes("mismatch")
  ) {
    status = 400;
  }
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
  const body = normalizeCreateBillBody(await req.json());

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

    const totalAmount = bills.reduce((sum, bill) => {
      const amount =
        typeof bill.finalTotal === "number"
          ? bill.finalTotal
          : bill.grandTotal || 0;
      return sum + amount;
    }, 0);

    return NextResponse.json({
      bills,
      totalBills: bills.length,
      totalAmount,
    });
  }

  if (search && search.length >= 3) {
    const escapedSearch = escapeRegex(search.trim());
    const customers = await Customer.find({
      $or: [
        { name: { $regex: escapedSearch, $options: "i" } },
        { mobile: { $regex: escapedSearch, $options: "i" } },
        { city: { $regex: escapedSearch, $options: "i" } },
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
  const totalAmountAgg = await Bill.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalAmount: {
          $sum: { $ifNull: ["$finalTotal", "$grandTotal"] },
        },
      },
    },
  ]);

  const totalAmount = Number(totalAmountAgg?.[0]?.totalAmount || 0);

  return NextResponse.json({
    bills,
    totalPages: Math.ceil(totalBills / limit),
    currentPage: page,
    totalBills,
    totalAmount,
  });
}

/* =====================================================
   UPDATE BILL (ATOMIC STOCK + BILL UPDATE)
===================================================== */
export async function PUT(req: Request) {
  await dbConnect();
  const {
    billId,
    updates,
    customerUpdates,
  } = normalizeUpdatePayload(await req.json());

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
