import { NextResponse } from "next/server";
import pool from "../../../lib/db";

export async function POST(request) {
  try {
    const body = await request.json();

    const email = String(body?.email || "")
      .trim()
      .toLowerCase();

    const code = String(body?.code || "").trim();

    const newPassword = String(body?.newPassword || "").trim();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "ایمیل را وارد کنید.",
        },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        {
          success: false,
          error: "کد بازیابی باید ۶ رقمی باشد.",
        },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "رمز عبور جدید باید حداقل ۶ کاراکتر باشد.",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        SELECT
          id,
          password_reset_code,
          password_reset_expires_at
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
          error: "پرسنلی با این ایمیل پیدا نشد.",
        },
        { status: 404 }
      );
    }

    const employee = result.rows[0];

    if (!employee.password_reset_code) {
      return NextResponse.json(
        {
          success: false,
          error: "کد بازیابی وجود ندارد. دوباره درخواست کد کنید.",
        },
        { status: 400 }
      );
    }

    if (employee.password_reset_code !== code) {
      return NextResponse.json(
        {
          success: false,
          error: "کد بازیابی صحیح نیست.",
        },
        { status: 400 }
      );
    }

    if (
      !employee.password_reset_expires_at ||
      new Date(employee.password_reset_expires_at) < new Date()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "کد بازیابی منقضی شده است. دوباره درخواست کد کنید.",
        },
        { status: 400 }
      );
    }

    await pool.query(
      `
        UPDATE personnel
        SET
          payslip_password = $1,
          password_reset_code = NULL,
          password_reset_expires_at = NULL
        WHERE id = $2
      `,
      [newPassword, employee.id]
    );

    return NextResponse.json({
      success: true,
      message: "رمز عبور با موفقیت تغییر کرد.",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "خطا در تغییر رمز عبور.",
      },
      { status: 500 }
    );
  }
}