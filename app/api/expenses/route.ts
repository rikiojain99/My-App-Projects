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
  const limitParam = Number(searchParams.get("limit") || 0);
  const title = (searchParams.get("title") || "").trim();
  const category = (searchParams.get("category") || "").trim();
  const search = (searchParams.get("search") || "").trim();

  let query: any = {};

  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }

  if (title) {
    query.title = {
      $regex: title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
  }

  if (category) {
    query.category = {
      $regex: category.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      ),
      $options: "i",
    };
  }

  if (search) {
    const escapedSearch = search.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    query.$or = [
      { title: { $regex: escapedSearch, $options: "i" } },
      {
        category: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      { note: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const findQuery = Expense.find(query).sort({ date: -1 });

  if (
    Number.isFinite(limitParam) &&
    limitParam > 0
  ) {
    findQuery.limit(Math.min(limitParam, 1000));
  }

  const expenses = await findQuery;

  return NextResponse.json(expenses);
}
