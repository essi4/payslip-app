import crypto from "crypto";
import pool from "../../../lib/db";
import { NextResponse } from "next/server";
import { sendPasswordRecoveryCode } from "../../../lib/email";

export async function POST(request) {
  try {
    const body = await request.json();
    const nationalId = String(body?.national_id || "").replace(/[^0-9]/g, "");
    const personnelCode = String(body?.personnel_code || "").trim();
    if (nationalId.length !== 10 || !personnelCode) return NextResponse.json({ success: false, error: "اطلاعات واردشده معتبر نیست." }, { status: 400 });

    // Backfill the recovery columns on existing production databases.
    await pool.query(`
      ALTER TABLE personnel
      ADD COLUMN IF NOT EXISTS password_reset_code VARCHAR(6),
      ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP
    `);

    const result = await pool.query(
      `SELECT id, full_name, email FROM personnel WHERE national_id=$1 AND personnel_code=$2 LIMIT 1`,
      [nationalId, personnelCode]
    );
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
      return NextResponse.json({ success: false, error: "ارسال ایمیل بازیابی انجام نشد." }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: "اگر اطلاعات کارمند معتبر باشد، کد بازیابی به ایمیل ثبت‌شده ارسال می‌شود." });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return NextResponse.json({ success: false, error: "خطا در بازیابی رمز عبور." }, { status: 500 });
  }
}
