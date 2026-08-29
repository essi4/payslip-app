import { NextResponse } from "next/server";
import { createAdminSession, COOKIE_NAME, SESSION_TTL_SECONDS } from "../../../lib/admin-auth";

export async function POST(request) {
  try {
    const body = await request.json();

    const username = body.username;
    const password = body.password;

    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "123456";

    if (username !== adminUsername || password !== adminPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "نام کاربری یا رمز عبور اشتباه است.",
        },
        { status: 401 }
      );
    }

    const session = createAdminSession();

    const response = NextResponse.json({
      success: true,
      message: "ورود با موفقیت انجام شد.",
    });

    response.cookies.set(COOKIE_NAME, session, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "خطا در ورود به سامانه.",
      },
      { status: 500 }
    );
  }
}