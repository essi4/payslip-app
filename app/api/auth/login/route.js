import { NextResponse } from "next/server";
import { createAdminSession } from "../../../lib/admin-auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const username = String(body?.username || "");
    const password = String(body?.password || "");
    const adminUsername = process.env.ADMIN_USERNAME?.trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      console.error("Admin credentials are not configured.");
      return NextResponse.json({ success: false, error: "ورود مدیر سامانه پیکربندی نشده است." }, { status: 500 });
    }

    if (!username || !password || username !== adminUsername || password !== adminPassword) {
      return NextResponse.json({ success: false, error: "نام کاربری یا رمز عبور اشتباه است." }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, message: "ورود با موفقیت انجام شد." });
    createAdminSession(response);
    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json({ success: false, error: "خطا در ورود به سامانه." }, { status: 500 });
  }
}
