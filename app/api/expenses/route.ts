import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Expense from "@/models/Expense";

/* ================= CREATE EXPENSE ================= */
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    const expense = await Expense.create(body);

    return NextResponse.json(expense, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

/* ================= GET EXPENSES ================= */
export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query: any = {};

  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }

  const expenses = await Expense.find(query)
    .sort({ date: -1 });

  return NextResponse.json(expenses);
}
