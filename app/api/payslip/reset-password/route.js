import pool from "../../../lib/db";
import { NextResponse } from "next/server";
import { hashPassword } from "../../../lib/password";

export async function POST(request) {
  try {
    const body = await request.json();
    const nationalId = String(body?.national_id || "").replace(/[^0-9]/g, "");
    const code = String(body?.code || "").trim();
    const newPassword = String(body?.new_password || "");

    if (nationalId.length !== 10) return NextResponse.json({ success: false, error: "کد ملی باید ۱۰ رقمی باشد." }, { status: 400 });
    if (!/^\d{6}$/.test(code)) return NextResponse.json({ success: false, error: "کد بازیابی باید ۶ رقمی باشد." }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ success: false, error: "رمز عبور جدید باید حداقل ۶ کاراکتر باشد." }, { status: 400 });

    const passwordHash = await hashPassword(newPassword);
    const result = await pool.query(
      `UPDATE personnel SET payslip_password=$1, password_reset_code=NULL, password_reset_expires_at=NULL
       WHERE national_id=$2 AND password_reset_code=$3 AND password_reset_expires_at > CURRENT_TIMESTAMP RETURNING id`,
      [passwordHash, nationalId, code]
    );
    if (!result.rowCount) return NextResponse.json({ success: false, error: "کد بازیابی صحیح یا معتبر نیست." }, { status: 400 });
    return NextResponse.json({ success: true, message: "رمز عبور با موفقیت تغییر کرد." });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return NextResponse.json({ success: false, error: "خطا در تغییر رمز عبور." }, { status: 500 });
  }
}
