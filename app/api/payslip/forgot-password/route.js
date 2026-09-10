import crypto from "crypto";
import pool from "../../../lib/db";
import { NextResponse } from "next/server";
import { sendPasswordRecoveryCode } from "../../../lib/email";

export async function POST(request) {
  try {
    const body = await request.json();
    const nationalId = String(body?.national_id || "").replace(/[^0-9]/g, "");
    if (nationalId.length !== 10) return NextResponse.json({ success: false, error: "کد ملی باید ۱۰ رقمی باشد." }, { status: 400 });

    const result = await pool.query(`SELECT id, full_name, email FROM personnel WHERE national_id=$1 LIMIT 1`, [nationalId]);
    if (!result.rows.length || !result.rows[0].email) {
      return NextResponse.json({ success: true, message: "اگر اطلاعات کارمند معتبر باشد، کد بازیابی به ایمیل ثبت‌شده ارسال می‌شود." });
    }

    const employee = result.rows[0];
    const code = String(crypto.randomInt(100000, 1000000));
    await pool.query(`UPDATE personnel SET password_reset_code=$1, password_reset_expires_at=CURRENT_TIMESTAMP + INTERVAL '10 minutes' WHERE id=$2`, [code, employee.id]);
    try {
      await sendPasswordRecoveryCode({ to: employee.email, code, employeeName: employee.full_name });
    } catch (emailError) {
      console.error("PASSWORD RECOVERY EMAIL ERROR:", emailError);
      await pool.query(`UPDATE personnel SET password_reset_code=NULL, password_reset_expires_at=NULL WHERE id=$1`, [employee.id]);
    }
    return NextResponse.json({ success: true, message: "اگر اطلاعات کارمند معتبر باشد، کد بازیابی به ایمیل ثبت‌شده ارسال می‌شود." });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return NextResponse.json({ success: false, error: "خطا در بازیابی رمز عبور." }, { status: 500 });
  }
}
