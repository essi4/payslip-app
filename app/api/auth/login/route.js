import { NextResponse } from "next/server";
import { createAdminSession } from "../../../lib/admin-auth";
import { checkRateLimit, clearRateLimit, getRequestIp } from "../../../lib/rate-limit";
import { logSecurityEvent } from "../../../lib/security-log";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");
    const adminUsername = process.env.ADMIN_USERNAME?.trim();
    const adminPassword = process.env.ADMIN_PASSWORD;
    const requestIp = getRequestIp(request);

    if (!adminUsername || !adminPassword) {
      console.error("Admin credentials are not configured.");
      return NextResponse.json({ success: false, error: "ورود مدیر سامانه پیکربندی نشده است." }, { status: 500 });
    }

    const ipLimit = await checkRateLimit({
      scope: "admin_login_ip",
      key: requestIp,
      maxAttempts: 10,
      windowMs: 15 * 60 * 1000,
      blockMs: 15 * 60 * 1000,
    });
    if (!ipLimit.allowed) {
      await logSecurityEvent({ event: "admin_login_rate_limit", request, success: false, details: { reason: "ip_limit" } });
      return NextResponse.json(
        { success: false, error: "تعداد تلاش‌های ورود مدیر بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } }
      );
    }

    if (!username || !password) {
      await logSecurityEvent({ event: "admin_login", request, success: false, details: { reason: "invalid_input" } });
      return NextResponse.json({ success: false, error: "نام کاربری یا رمز عبور اشتباه است." }, { status: 401 });
    }

    if (username === adminUsername) {
      const accountLimit = await checkRateLimit({
        scope: "admin_login_account",
        key: adminUsername,
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000,
        blockMs: 15 * 60 * 1000,
      });
      if (!accountLimit.allowed) {
        await logSecurityEvent({ event: "admin_login_rate_limit", request, success: false, details: { reason: "account_limit" } });
        return NextResponse.json(
          { success: false, error: "تعداد تلاش‌های ورود مدیر بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید." },
          { status: 429, headers: { "Retry-After": String(accountLimit.retryAfterSeconds) } }
        );
      }
    }

    if (username !== adminUsername || password !== adminPassword) {
      await logSecurityEvent({ event: "admin_login", request, success: false, details: { reason: "invalid_credentials" } });
      return NextResponse.json({ success: false, error: "نام کاربری یا رمز عبور اشتباه است." }, { status: 401 });
    }

    await clearRateLimit({ scope: "admin_login_ip", key: requestIp });
    await clearRateLimit({ scope: "admin_login_account", key: adminUsername });
    await logSecurityEvent({ event: "admin_login", request, success: true });

    const response = NextResponse.json({ success: true, message: "ورود با موفقیت انجام شد." });
    createAdminSession(response);
    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json({ success: false, error: "خطا در ورود به سامانه." }, { status: 500 });
  }
}
