import crypto from "crypto";
import pool from "../../../lib/db";
import { NextResponse } from "next/server";
import { hashPassword } from "../../../lib/password";
import { logSecurityEvent } from "../../../lib/security-log";
import { checkRateLimit, clearRateLimit, getRequestIp } from "../../../lib/rate-limit";

function hashRecoveryCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function rateLimitedResponse(retryAfterSeconds) {
  return NextResponse.json(
    { success: false, error: "تعداد تلاش‌های بازیابی بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}

export async function POST(request) {
  try {
    const body = await request.json();
    const nationalId = String(body?.national_id || "").replace(/[^0-9]/g, "");
    const personnelCode = String(body?.personnel_code || "").trim();
    const code = String(body?.recovery_code ?? body?.code ?? "").trim();
    const newPassword = String(body?.new_password || "");
    const requestIp = getRequestIp(request);

    const ipLimit = await checkRateLimit({ scope: "password_reset_ip", key: requestIp, maxAttempts: 10, windowMs: 15 * 60 * 1000, blockMs: 15 * 60 * 1000 });
    if (!ipLimit.allowed) {
      await logSecurityEvent({ event: "password_reset_rate_limit", request, success: false, details: { reason: "ip_limit" } });
      return rateLimitedResponse(ipLimit.retryAfterSeconds);
    }

    if (nationalId.length !== 10 || !personnelCode || !/^\d{6}$/.test(code)) return NextResponse.json({ success: false, error: "کد بازیابی صحیح یا معتبر نیست." }, { status: 400 });
    if (newPassword.length < 8) return NextResponse.json({ success: false, error: "رمز عبور جدید باید حداقل ۸ کاراکتر باشد." }, { status: 400 });

    const accountLimit = await checkRateLimit({ scope: "password_reset_account", key: `${nationalId}:${personnelCode}`, maxAttempts: 5, windowMs: 15 * 60 * 1000, blockMs: 15 * 60 * 1000 });
    if (!accountLimit.allowed) {
      await logSecurityEvent({ event: "password_reset_rate_limit", request, success: false, details: { reason: "account_limit" } });
      return rateLimitedResponse(accountLimit.retryAfterSeconds);
    }

    await pool.query(`ALTER TABLE personnel ADD COLUMN IF NOT EXISTS password_reset_code VARCHAR(64), ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP`);
    const codeHash = hashRecoveryCode(code);
    const passwordHash = await hashPassword(newPassword);
    const result = await pool.query(
      `UPDATE personnel SET payslip_password=$1, password_reset_code=NULL, password_reset_expires_at=NULL
       WHERE national_id=$2 AND personnel_code=$3
         AND (password_reset_code=$4 OR password_reset_code=$5)
         AND password_reset_expires_at > CURRENT_TIMESTAMP
       RETURNING id`,
      [passwordHash, nationalId, personnelCode, codeHash, code]
    );
    if (!result.rowCount) {
      await logSecurityEvent({ event: "password_reset", request, success: false, details: { reason: "invalid_or_expired_code" } });
      return NextResponse.json({ success: false, error: "کد بازیابی صحیح یا معتبر نیست." }, { status: 400 });
    }

    const employeeId = result.rows[0].id;
    await clearRateLimit({ scope: "password_reset_account", key: `${nationalId}:${personnelCode}` });
    await clearRateLimit({ scope: "password_reset_ip", key: requestIp });
    await logSecurityEvent({ employeeId, event: "password_reset", request, success: true });
    return NextResponse.json({ success: true, message: "رمز عبور با موفقیت تغییر کرد." });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return NextResponse.json({ success: false, error: "تغییر رمز عبور انجام نشد. دوباره تلاش کنید." }, { status: 500 });
  }
}
