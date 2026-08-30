import pool from "../../../lib/db";
import { NextResponse } from "next/server";
import { sendPasswordRecoveryCode } from "../../../lib/email";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "ایمیل را وارد کنید." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT id, full_name, email
       FROM personnel
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "این ایمیل در سیستم ثبت نشده است." },
        { status: 404 }
      );
    }

    const employee = result.rows[0];
    const code = String(Math.floor(100000 + Math.random() * 900000));

    await pool.query(
      `UPDATE personnel
       SET password_reset_code = $1,
           password_reset_expires_at = CURRENT_TIMESTAMP + INTERVAL '10 minutes'
       WHERE id = $2`,
      [code, employee.id]
    );

    try {
      await sendPasswordRecoveryCode({
        to: employee.email,
        code,
        employeeName: employee.full_name,
      });
    } catch (emailError) {
      console.error("PASSWORD RECOVERY EMAIL ERROR:", emailError);
      await pool.query(
        `UPDATE personnel
         SET password_reset_code = NULL,
             password_reset_expires_at = NULL
         WHERE id = $1`,
        [employee.id]
      );

      return NextResponse.json(
        { success: false, error: "ارسال ایمیل بازیابی انجام نشد. تنظیمات ایمیل سامانه را بررسی کنید." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "کد بازیابی به ایمیل ثبت‌شده شما ارسال شد.",
    });
  } catch (error) {
    console.error("REQUEST RESET ERROR:", error);
    return NextResponse.json(
      { success: false, error: "خطا در ایجاد کد بازیابی." },
      { status: 500 }
    );
  }
}
