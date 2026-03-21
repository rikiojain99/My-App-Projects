import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Customer from "@/models/Customer";
import Bill from "@/models/Bill";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const mobile = searchParams.get("mobile");
  const search = String(searchParams.get("search") || "").trim();

  if (mobile) {
    const customer = await Customer.findOne({ mobile }).lean();
    return NextResponse.json(customer);
  }

  const query = search
    ? {
        $or: [
          { name: { $regex: escapeRegex(search), $options: "i" } },
          { type: { $regex: escapeRegex(search), $options: "i" } },
          { city: { $regex: escapeRegex(search), $options: "i" } },
          { mobile: { $regex: escapeRegex(search), $options: "i" } },
        ],
      }
    : {};

  const customers = await Customer.find(query)
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();

  const customerIds = customers.map((customer: any) => customer._id);
  const billStats = customerIds.length
    ? await Bill.aggregate([
        {
          $match: {
            customerId: { $in: customerIds },
            deleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: "$customerId",
            billCount: { $sum: 1 },
            totalSpent: { $sum: { $ifNull: ["$finalTotal", 0] } },
            lastBillDate: { $max: "$createdAt" },
          },
        },
      ])
    : [];

  const statsMap = new Map(
    billStats.map((row: any) => [
      String(row._id),
      {
        billCount: Number(row.billCount || 0),
        totalSpent: Number(row.totalSpent || 0),
        lastBillDate: row.lastBillDate || null,
      },
    ])
  );

  return NextResponse.json(
    customers.map((customer: any) => {
      const stats = statsMap.get(String(customer._id));

      return {
        ...customer,
        billCount: Number(stats?.billCount || 0),
        totalSpent: Number(stats?.totalSpent || 0),
        lastBillDate: stats?.lastBillDate || null,
      };
    })
  );
}

export async function POST(req: Request) {
  await dbConnect();
  const { name, type, city, mobile } = await req.json();

  try {
    let customer = await Customer.findOne({ mobile });
    if (!customer) {
      customer = await Customer.create({ name, type, city, mobile });
    }
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save customer" },
      { status: 400 }
    );
  }
}

type CustomerUpdateBody = {
  id?: string;
  name?: string;
  type?: string;
  city?: string;
  mobile?: string;
  isDisabled?: boolean;
};

export async function PATCH(req: Request) {
  await dbConnect();

  try {
    const body = (await req.json()) as CustomerUpdateBody;
    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim();
    const type = String(body.type || "").trim();
    const city = String(body.city || "").trim();
    const mobile = String(body.mobile || "").trim();
    const isDisabled =
      typeof body.isDisabled === "boolean"
        ? body.isDisabled
        : undefined;

    if (!id) {
      return NextResponse.json(
        { error: "Customer id is required" },
        { status: 400 }
      );
    }

    if (!name || !type) {
      return NextResponse.json(
        { error: "Customer name and type are required" },
        { status: 400 }
      );
    }

    if (
      !mobile ||
      (mobile !== "FAST-SALE" && !/^\d{10}$/.test(mobile))
    ) {
      return NextResponse.json(
        { error: "Mobile must be 10 digits or FAST-SALE" },
        { status: 400 }
      );
    }

    const existing = await Customer.findById(id);

    if (!existing) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const duplicate = await Customer.findOne({
      _id: { $ne: existing._id },
      mobile,
    }).lean();

    if (duplicate) {
      return NextResponse.json(
        { error: "Another customer already uses this mobile" },
        { status: 409 }
      );
    }

    existing.name = name;
    existing.type = type;
    existing.city = city;
    existing.mobile = mobile;
    if (typeof isDisabled === "boolean") {
      existing.isDisabled = isDisabled;
    }
    await existing.save();

    return NextResponse.json(existing);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update customer" },
      { status: 400 }
    );
  }
}

type CustomerDeleteBody = {
  id?: string;
};

export async function DELETE(req: Request) {
  await dbConnect();

  try {
    const body = (await req.json()) as CustomerDeleteBody;
    const id = String(body.id || "").trim();

    if (!id) {
      return NextResponse.json(
        { error: "Customer id is required" },
        { status: 400 }
      );
    }

    const existing = await Customer.findById(id);

    if (!existing) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const linkedBillCount = await Bill.countDocuments({
      customerId: existing._id,
      deleted: { $ne: true },
    });

    if (linkedBillCount > 0) {
      return NextResponse.json(
        {
          error:
            "Customer has linked bills. Disable this customer instead of deleting.",
        },
        { status: 409 }
      );
    }

    await Customer.deleteOne({ _id: existing._id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete customer" },
      { status: 400 }
    );
  }
}
