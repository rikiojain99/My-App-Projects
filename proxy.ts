import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySignedToken } from "@/lib/auth-token";

const PUBLIC_PAGE_PATHS = new Set(["/"]);

export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isApi = pathname.startsWith("/api");
  const isAuthApi = pathname.startsWith("/api/auth");

  if (isAuthApi) {
    return NextResponse.next();
  }

  if (!isApi && PUBLIC_PAGE_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get("auth")?.value;
  const payload = token ? verifySignedToken(token) : null;

  if (payload) {
    return NextResponse.next();
  }

  if (isApi) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const redirectUrl = new URL("/", req.url);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
