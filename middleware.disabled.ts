import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // ✅ Allow React Server Component requests
  if (searchParams.has("_rsc")) {
    return NextResponse.next();
  }

  // ✅ Public route (login)
  if (pathname === "/") {
    return NextResponse.next();
  }

  // ✅ Check auth cookie
  const isAuthenticated = req.cookies.get("auth")?.value === "true";

  if (!isAuthenticated) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * ✅ Apply middleware to ALL pages except static & api
 */
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
