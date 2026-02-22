import { NextResponse } from "next/server";
import { createSignedToken } from "@/lib/auth-token";

const ADMIN_PASSKEY = process.env.ADMIN_PASSKEY;

const EMPLOYEE_PASSKEYS = [
  process.env.EMPLOYEE_PASSKEY_1,
  process.env.EMPLOYEE_PASSKEY_2,
  process.env.EMPLOYEE_PASSKEY_3,
  process.env.EMPLOYEE_PASSKEY_4,
].filter(Boolean);

export async function POST(req: Request) {
  try {
    if (!ADMIN_PASSKEY) {
      return NextResponse.json(
        { ok: false, error: "Server misconfigured: ADMIN_PASSKEY missing" },
        { status: 500 }
      );
    }

    const { passkey } = await req.json();

    let role: "admin" | "employee" | null = null;

    if (passkey === ADMIN_PASSKEY) {
      role = "admin";
    } else if (EMPLOYEE_PASSKEYS.includes(passkey)) {
      role = "employee";
    }

    if (!role) {
      return NextResponse.json(
        { ok: false, error: "Invalid passkey" },
        { status: 403 }
      );
    }

    /* =========================
       CREATE SIGNED COOKIE
    ========================= */

    const token = createSignedToken({
      role,
      time: Date.now(),
    });

    const res = NextResponse.json({ ok: true, role });

    res.cookies.set("auth", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Bad request" },
      { status: 400 }
    );
  }
}
