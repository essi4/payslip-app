import { NextResponse } from "next/server";
import pool from "../../../lib/db";

export async function POST(request) {
  try {
    const body = await request.json();

    const nationalId = String(body.national_id || "")
      .replace(/[^0-9]/g, "");

    const newPassword = String(body.new_password || "").trim();

    if (!nationalId) {
      return NextResponse.json(
        {
          success: false,
          error: "کد ملی وارد نشده است.",
        },
        { status: 400 }
      );
    }

    if (nationalId.length !== 10) {
      return NextResponse.json(
        {
          success: false,
          error: "کد ملی باید ۱۰ رقمی باشد.",
        },
        { status: 400 }
      );
    }

    if (!newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "رمز عبور جدید را وارد کنید.",
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 4) {
      return NextResponse.json(
        {
          success: false,
          error: "رمز عبور باید حداقل ۴ کاراکتر باشد.",
        },
        { status: 400 }
      );
    }

    const employeeResult = await pool.query(
      `
      SELECT
        id,
        full_name,
        personnel_code
      FROM personnel
      WHERE national_id = $1
      LIMIT 1
      `,
      [nationalId]
    );

    if (employeeResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "کارمندی با این کد ملی پیدا نشد.",
        },
        { status: 404 }
      );
    }

    const employee = employeeResult.rows[0];

    await pool.query(
      `
      UPDATE personnel
      SET payslip_password = $1
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