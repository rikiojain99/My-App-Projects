import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  await dbConnect();
  const users = await User.find({});
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const data = await req.json();

    // Debug: log the incoming request body
    console.log("Incoming data:", data);

    const user = await User.create({
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      address: data.address,
      age: data.age,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error("User creation failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
