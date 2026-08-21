import { NextResponse } from "next/server";
import pool from "../../lib/db";

export async function GET(request) {
  try {
    const url = new URL(request.url);

    const nationalId = url.searchParams.get("national_id");
    const password = url.searchParams.get("password");
    const month = url.searchParams.get("month");
    const year = url.searchParams.get("year");

    if (!nationalId) {
      return NextResponse.json(
        {
          success: false,
          error: "کد ملی وارد نشده است.",
        },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          error: "رمز عبور وارد نشده است.",
        },
        { status: 400 }
      );
    }

    const cleanNationalId = nationalId.replace(/[^0-9]/g, "");

    if (cleanNationalId.length !== 10) {
      return NextResponse.json(
        {
          success: false,
          error: "کد ملی باید ۱۰ رقمی باشد.",
        },
        { status: 400 }
      );
    }

    /*
      مرحله اول:
      بررسی کد ملی و رمز
    */

    const employeeResult = await pool.query(
      `
      SELECT
        id,
        full_name,
        national_id,
        personnel_code,
        department,
        payslip_password
      FROM personnel
      WHERE national_id = $1
        AND payslip_password = $2
      LIMIT 1
      `,
      [cleanNationalId, password]
    );

    if (employeeResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "کد ملی یا رمز عبور اشتباه است.",
        },
        { status: 401 }
      );
    }

    const employee = employeeResult.rows[0];

    /*
      اگر ماه انتخاب نشده باشد،
      فقط لیست ماه‌های دارای فیش را برمی‌گردانیم.
    */

    if (!month || !year) {
      const monthsResult = await pool.query(
        `
        SELECT
          id,
          year,
          month,
          net_salary,
          created_at
        FROM payslips
        WHERE personnel_id = $1
        ORDER BY id DESC
        `,
        [employee.id]
      );

      return NextResponse.json({
        success: true,
        employee: {
          id: employee.id,
          full_name: employee.full_name,
          national_id: employee.national_id,
          personnel_code: employee.personnel_code,
          department: employee.department,
        },
        months: monthsResult.rows,
      });
    }

    /*
      اگر ماه انتخاب شده باشد،
      فقط همان فیش را برمی‌گردانیم.
    */

    const payslipResult = await pool.query(
      `
      SELECT
        p.id,
        p.personnel_id,
        p.year,
        p.month,

        p.bank_account,
        p.job_group,
        p.job_title,

        p.base_salary,
        p.overtime,
        p.bonus,

        p.housing_allowance,
        p.food_allowance,
        p.marriage_allowance,
        p.child_allowance,
        p.other_benefits,

        p.insurance,
        p.tax,
        p.other_deductions,

        p.net_salary,
        p.created_at,

        e.full_name,
        e.personnel_code,
        e.national_id,
        e.department,
        e.job_title AS employee_job_title

      FROM payslips p

      INNER JOIN personnel e
        ON p.personnel_id = e.id

      WHERE p.personnel_id = $1
        AND p.month = $2
        AND p.year = $3

      ORDER BY p.id DESC
      `,
      [employee.id, month, year]
    );

    if (payslipResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "برای این ماه فیشی پیدا نشد.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        full_name: employee.full_name,
        national_id: employee.national_id,
        personnel_code: employee.personnel_code,
        department: employee.department,
      },
      data: payslipResult.rows,
    });

  } catch (error) {
    console.error("=================================");
    console.error("PAYSLIP API ERROR");
    console.error("MESSAGE:", error.message);
    console.error("CODE:", error.code);
    console.error("DETAIL:", error.detail);
    console.error("=================================");

    return NextResponse.json(
      {
        success: false,
        error: error.message || "خطا در دریافت فیش حقوقی.",
        code: error.code || null,
      },
      { status: 500 }
    );
  }
}