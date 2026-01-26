import { cookies } from "next/headers";

export async function requireAuth() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("auth")?.value;

  if (auth !== "true") {
    throw new Error("UNAUTHORIZED");
  }
}
