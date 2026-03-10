import { NextResponse } from "next/server";
import mongoose, {
  type ClientSession,
} from "mongoose";
import dbConnect from "@/lib/mongodb";
import DailySale from "@/models/DailySale";
import ItemStock from "@/models/ItemStock";
import { getBusinessDateKey } from "@/lib/date/getBusinessDateKey";

type PaymentMode = "cash" | "upi" | "split";

type SaleItem = {
  name: string;
  qty: number;
  rate: number;
  total: number;
};

type DailySalePayload = {
  items: SaleItem[];
  total: number;
  paymentMode: PaymentMode;
  cashAmount: number;
  upiAmount: number;
  upiId: string | null;
  upiAccount: string | null;
};

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const isSameAmount = (a: number, b: number) =>
  Math.abs(roundMoney(a) - roundMoney(b)) < 0.01;

const isTransactionUnsupported = (err: unknown) => {
  const message = String(
    (err as { message?: string })?.message || ""
  );
  return (
    message.includes("Transaction numbers are only allowed") ||
    message.includes("replica set member or mongos")
  );
};

const aggregateItemQty = (items: SaleItem[]) => {
  const map = new Map<string, number>();

  for (const item of items) {
    map.set(item.name, (map.get(item.name) || 0) + item.qty);
  }

  return map;
};

function normalizePayload(rawBody: any): DailySalePayload {
  if (!Array.isArray(rawBody?.items) || rawBody.items.length === 0) {
    throw new Error("Items required");
  }

  const items: SaleItem[] = rawBody.items.map(
    (rawItem: any, index: number) => {
      const name = String(rawItem?.name || "").trim();
      const qty = Number(rawItem?.qty);
      const rate = Number(rawItem?.rate);

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
    }
  );

  const total = roundMoney(Number(rawBody?.total));
  const cashAmount = roundMoney(Number(rawBody?.cashAmount ?? 0));
  const upiAmount = roundMoney(Number(rawBody?.upiAmount ?? 0));
  const paymentMode = rawBody?.paymentMode as PaymentMode;
  const upiId = String(rawBody?.upiId || "").trim() || null;
  const upiAccount =
    String(rawBody?.upiAccount || "").trim() || null;

  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("Invalid total amount");
  }

  if (
    !Number.isFinite(cashAmount) ||
    !Number.isFinite(upiAmount) ||
    cashAmount < 0 ||
    upiAmount < 0
  ) {
    throw new Error("Invalid payment amount");
  }

  if (!["cash", "upi", "split"].includes(paymentMode)) {
    throw new Error("Invalid payment mode");
  }

  if (paymentMode === "cash") {
    if (!isSameAmount(cashAmount, total) || upiAmount !== 0) {
      throw new Error("Payment mismatch");
    }
  }

  if (paymentMode === "upi") {
    if (
      !isSameAmount(upiAmount, total) ||
      cashAmount !== 0 ||
      !upiAccount
    ) {
      throw new Error("Payment mismatch");
    }
  }

  if (paymentMode === "split") {
    if (!isSameAmount(cashAmount + upiAmount, total)) {
      throw new Error("Payment mismatch");
    }

    if (upiAmount > 0 && !upiAccount) {
      throw new Error("UPI account required");
    }
  }

  return {
    items,
    total,
    paymentMode,
    cashAmount,
    upiAmount,
    upiId,
    upiAccount,
  };
}

async function getOrCreateOpenDailySale(
  dateKey: string,
  session?: ClientSession
) {
  const findQuery = DailySale.findOne({ date: dateKey });
  if (session) findQuery.session(session);

  const existing = await findQuery;

  if (existing) {
    if (existing.isClosed) {
      throw new Error("Day already closed");
    }
    return existing;
  }

  try {
    if (session) {
      const [created] = await DailySale.create(
        [
          {
            date: dateKey,
            transactions: [],
            totalRevenue: 0,
            totalCash: 0,
            totalUpi: 0,
            isClosed: false,
          },
        ],
        { session }
      );
      return created;
    }

    return await DailySale.create({
      date: dateKey,
      transactions: [],
      totalRevenue: 0,
      totalCash: 0,
      totalUpi: 0,
      isClosed: false,
    });
  } catch (err: any) {
    const duplicate =
      err?.code === 11000 ||
      String(err?.message || "").includes("E11000");

    if (!duplicate) {
      throw err;
    }

    const retryQuery = DailySale.findOne({ date: dateKey });
    if (session) retryQuery.session(session);

    const racedDailySale = await retryQuery;

    if (!racedDailySale) {
      throw err;
    }

    if (racedDailySale.isClosed) {
      throw new Error("Day already closed");
    }

    return racedDailySale;
  }
}

async function validateAndDeductStock(
  items: SaleItem[],
  options?: {
    session?: ClientSession;
    deducted?: Array<{ itemName: string; qty: number }>;
  }
) {
  const qtyMap = aggregateItemQty(items);
  const managedItems: Array<{ itemName: string; qty: number }> = [];

  for (const [itemName, qty] of qtyMap.entries()) {
    const stockQuery = ItemStock.findOne({ itemName });
    if (options?.session) {
      stockQuery.session(options.session);
    }

    const stock = await stockQuery;

    if (
      stock &&
      stock.availableQty > 0 &&
      stock.availableQty < qty
    ) {
      throw new Error(`Insufficient stock for ${itemName}`);
    }

    if (stock && stock.availableQty > 0) {
      managedItems.push({ itemName, qty });
    }
  }

  for (const managedItem of managedItems) {
    await ItemStock.updateOne(
      { itemName: managedItem.itemName },
      {
        $inc: { availableQty: -managedItem.qty },
        $set: { lastUpdated: new Date() },
      },
      options?.session ? { session: options.session } : undefined
    );

    if (options?.deducted) {
      options.deducted.push(managedItem);
    }
  }
}

async function appendSaleTransaction(
  payload: DailySalePayload,
  dateKey: string,
  session?: ClientSession
) {
  const dailySale = await getOrCreateOpenDailySale(dateKey, session);

  if (dailySale.isClosed) {
    throw new Error("Day already closed");
  }

  dailySale.transactions = dailySale.transactions || [];
  dailySale.transactions.push({
    items: payload.items,
    total: payload.total,
    paymentMode: payload.paymentMode,
    cashAmount: payload.cashAmount,
    upiAmount: payload.upiAmount,
    upiId: payload.upiId,
    upiAccount: payload.upiAccount,
    createdAt: new Date(),
  });

  dailySale.totalRevenue = roundMoney(
    Number(dailySale.totalRevenue || 0) + payload.total
  );
  dailySale.totalCash = roundMoney(
    Number(dailySale.totalCash || 0) + payload.cashAmount
  );
  dailySale.totalUpi = roundMoney(
    Number(dailySale.totalUpi || 0) + payload.upiAmount
  );

  await dailySale.save(session ? { session } : undefined);
}

async function persistWithoutTransaction(
  payload: DailySalePayload,
  dateKey: string
) {
  const deducted: Array<{ itemName: string; qty: number }> = [];

  try {
    await getOrCreateOpenDailySale(dateKey);
    await validateAndDeductStock(payload.items, { deducted });
    await appendSaleTransaction(payload, dateKey);
  } catch (err) {
    // Best-effort rollback for environments without DB transactions.
    await Promise.all(
      deducted.map((item) =>
        ItemStock.updateOne(
          { itemName: item.itemName },
          {
            $inc: { availableQty: item.qty },
            $set: { lastUpdated: new Date() },
          }
        )
      )
    ).catch(() => {});

    throw err;
  }
}

const mapErrorStatus = (message: string) => {
  if (message === "Day already closed") return 409;
  if (message.includes("Insufficient stock")) return 400;
  if (
    message.includes("Invalid") ||
    message.includes("required") ||
    message.includes("mismatch")
  ) {
    return 400;
  }
  return 500;
};

/* =====================================================
   CREATE FAST BILL ENTRY
===================================================== */

export async function POST(req: Request) {
  try {
    await dbConnect();

    const payload = normalizePayload(await req.json());
    const today = getBusinessDateKey();
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await validateAndDeductStock(payload.items, {
          session,
        });
        await appendSaleTransaction(payload, today, session);
      });
    } catch (err) {
      if (isTransactionUnsupported(err)) {
        await persistWithoutTransaction(payload, today);
      } else {
        throw err;
      }
    } finally {
      session.endSession();
    }

    return NextResponse.json(
      { success: true },
      { status: 201 }
    );

  } catch (err: any) {
    console.error("Daily sale failed:", err.message);
    return NextResponse.json(
      { error: err.message },
      { status: mapErrorStatus(String(err?.message || "")) }
    );
  }
}

/* =====================================================
   GET TODAY SUMMARY
===================================================== */
export async function GET() {
  try {
    await dbConnect();

    const today = getBusinessDateKey();

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
