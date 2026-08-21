import { NextResponse } from "next/server";
import pool from "../../../lib/db";

export async function POST(request) {
  try {
    const body = await request.json();

    const nationalId = String(body.national_id || "")
      .replace(/[^0-9]/g, "");

    if (!nationalId) {
      return NextResponse.json(
        {
          success: false,
          error: "کد ملی را وارد کنید.",
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

    const result = await pool.query(
      `
      SELECT
        id,
        full_name,
        national_id,
        personnel_code
      FROM personnel
      WHERE national_id = $1
      LIMIT 1
      `,
      [nationalId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "کارمندی با این کد ملی پیدا نشد.",
        },
        { status: 404 }
      );
    }

    const employee = result.rows[0];

    /*
      فعلاً بدون SMS:
      اگر کارمند وجود داشته باشد، اجازه رفتن
      به مرحله تعیین رمز جدید داده می‌شود.

      بعداً این قسمت به سرویس پیامک متصل می‌شود.
    */

    return NextResponse.json({
      success: true,
      message:
        "کارمند شناسایی شد. می‌توانید رمز عبور جدید تعیین کنید.",
      employee: {
        id: employee.id,
        full_name: employee.full_name,
        personnel_code: employee.personnel_code,
      },
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "خطا در بازیابی رمز عبور.",
      },
      { status: 500 }
    );
  }
}