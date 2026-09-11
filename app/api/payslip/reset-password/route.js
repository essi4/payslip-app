import crypto from "crypto";
import pool from "../../../lib/db";
import { NextResponse } from "next/server";
import { hashPassword } from "../../../lib/password";

function hashRecoveryCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const nationalId = String(body?.national_id || "").replace(/[^0-9]/g, "");
    const personnelCode = String(body?.personnel_code || "").trim();
    const code = String(body?.recovery_code ?? body?.code ?? "").trim();
    const newPassword = String(body?.new_password || "");

    if (nationalId.length !== 10 || !personnelCode || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ success: false, error: "کد بازیابی صحیح یا معتبر نیست." }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, error: "رمز عبور جدید باید حداقل ۸ کاراکتر باشد." }, { status: 400 });
    }

    await pool.query(`
      ALTER TABLE personnel
      ADD COLUMN IF NOT EXISTS password_reset_code VARCHAR(64),
      ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP
    `);

    const codeHash = hashRecoveryCode(code);
    const passwordHash = await hashPassword(newPassword);
    const result = await pool.query(
      `UPDATE personnel SET payslip_password=$1, password_reset_code=NULL, password_reset_expires_at=NULL
       WHERE national_id=$2 AND personnel_code=$3 AND password_reset_code=$4 AND password_reset_expires_at > CURRENT_TIMESTAMP
       RETURNING id`,
      [passwordHash, nationalId, personnelCode, codeHash]
    );
    if (!result.rowCount) return NextResponse.json({ success: false, error: "کد بازیابی صحیح یا معتبر نیست." }, { status: 400 });
    return NextResponse.json({ success: true, message: "رمز عبور با موفقیت تغییر کرد." });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return NextResponse.json({ success: false, error: "تغییر رمز عبور انجام نشد. دوباره تلاش کنید." }, { status: 500 });
  }
}
