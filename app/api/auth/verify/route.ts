import { NextResponse } from "next/server";

const ADMIN_PASSKEY = process.env.ADMIN_PASSKEY || "admin123";

// Collect all employee passkeys from env
const EMPLOYEE_PASSKEYS = [
  process.env.EMPLOYEE_PASSKEY_1,
  process.env.EMPLOYEE_PASSKEY_2,
  process.env.EMPLOYEE_PASSKEY_3,
  process.env.EMPLOYEE_PASSKEY_4,
].filter(Boolean); // remove undefined

export async function POST(req: Request) {
  try {
    const { passkey } = await req.json();

    // ✅ Admin
    if (passkey === ADMIN_PASSKEY) {
      return NextResponse.json({ ok: true, role: "admin" });
    }

    // ✅ Employee (check any of the keys)
    if (EMPLOYEE_PASSKEYS.includes(passkey)) {
      return NextResponse.json({ ok: true, role: "employee" });
    }

    // ❌ Invalid
    return NextResponse.json(
      { ok: false, error: "Invalid passkey" },
      { status: 403 }
    );
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
}
