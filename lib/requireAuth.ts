import { cookies } from "next/headers";
import { verifySignedToken } from "@/lib/auth-token";

export async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth")?.value;

  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const payload = verifySignedToken(token);
  if (!payload) {
    throw new Error("UNAUTHORIZED");
  }

  return payload;
}
