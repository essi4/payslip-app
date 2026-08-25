import { NextResponse } from "next/server";
import pool from "../../../lib/db";

export async function POST(request) {
  try {
    const body = await request.json();

    const email = String(body?.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "لطفاً ایمیل را وارد کنید.",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        SELECT id, full_name
        FROM personnel
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "کارمندی با این ایمیل پیدا نشد.",
        },
        { status: 404 }
      );
    }

    const employee = result.rows[0];

    const resetCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    await pool.query(
      `
        UPDATE personnel
        SET
          password_reset_code = $1,
          password_reset_expires_at =
            CURRENT_TIMESTAMP + INTERVAL '10 minutes'
        WHERE id = $2
      `,
      [resetCode, employee.id]
    );

    console.log(
      `🔐 Password reset code for ${email}: ${resetCode}`
    );

    return NextResponse.json({
      success: true,
      message: "کد بازیابی با موفقیت ایجاد شد.",
      name: employee.full_name,
      email,
      // موقتاً برای تست
      resetCode,
    });
  } catch (error) {
    console.error(
      "FORGOT PASSWORD ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "خطا در ارتباط با دیتابیس.",
      },
      { status: 500 }
    );
  }
}