import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // صفحه ورود آزاد است
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // تمام مسیرهای /admin محافظت می‌شوند
  if (pathname.startsWith("/admin")) {
    const session = request.cookies.get("admin_logged_in");

    if (!session || session.value !== "true") {
      const loginUrl = new URL(
        "/admin/login",
        request.url
      );

      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};