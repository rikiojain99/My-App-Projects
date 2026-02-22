import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySignedToken } from "@/lib/auth-token";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth")?.value;

  if (!token) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const payload = verifySignedToken(token);
  if (!payload) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    role: (payload as { role?: string }).role ?? null,
  });
}
