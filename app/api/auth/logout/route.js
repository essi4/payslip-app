import { NextResponse } from "next/server";
import { COOKIE_NAME } from "../../../lib/admin-auth";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "خروج با موفقیت انجام شد.",
  });

  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });

  response.cookies.set("admin_logged_in", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });

  return response;
}