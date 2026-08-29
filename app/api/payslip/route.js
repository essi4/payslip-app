import { NextResponse } from "next/server";
import pool from "../../lib/db";

export const dynamic = "force-dynamic";

function normalizeDigits(value) {
  return String(value || "")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const nationalId = normalizeDigits(url.searchParams.get("national_id"));
    const password = normalizeDigits(url.searchParams.get("password"));
    const month = url.searchParams.get("month");
    const year = normalizeDigits(url.searchParams.get("year"));

    if (!nationalId) return NextResponse.json({ success: false, error: "کد ملی وارد نشده است." }, { status: 400 });
    if (!password) return NextResponse.json({ success: false, error: "رمز عبور وارد نشده است." }, { status: 400 });
    if (nationalId.length !== 10) return NextResponse.json({ success: false, error: "کد ملی باید ۱۰ رقمی باشد." }, { status: 400 });

    const employeeResult = await pool.query(
      `SELECT id, full_name, national_id, personnel_code, department FROM personnel WHERE national_id = $1 AND payslip_password = $2 LIMIT 1`,
      [nationalId, password]
    );

    if (employeeResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: "کد ملی یا رمز عبور اشتباه است." }, { status: 401 });
    }

    const employee = employeeResult.rows[0];

    if (!month || !year) {
      const monthsResult = await pool.query(
        `SELECT id, year, month, net_salary, created_at FROM payslips WHERE personnel_id = $1 ORDER BY id DESC`,
        [employee.id]
      );

      return NextResponse.json({ success: true, employee, months: monthsResult.rows });
    }

    const payslipResult = await pool.query(
      `
      SELECT
        p.id, p.personnel_id, p.year, p.month,
        p.bank_account, p.job_group, p.job_title,
        p.base_salary, p.overtime, p.bonus,
        p.housing_allowance, p.food_allowance,
        p.marriage_allowance, p.child_allowance,
        p.other_benefits, p.insurance, p.tax,
        p.other_deductions, p.net_salary, p.created_at,
        e.full_name, e.personnel_code, e.national_id,
        e.department, e.job_title AS employee_job_title
      FROM payslips p
      INNER JOIN personnel e ON p.personnel_id = e.id
      WHERE p.personnel_id = $1 AND p.month = $2 AND p.year = $3
      ORDER BY p.id DESC
      `,
      [employee.id, month, year]
    );

    if (payslipResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: "برای این ماه فیشی پیدا نشد." }, { status: 404 });
    }

    return NextResponse.json({ success: true, employee, data: payslipResult.rows });
  } catch (error) {
    console.error("PAYSLIP API ERROR:", error);
    return NextResponse.json({ success: false, error: error.message || "خطا در دریافت فیش حقوقی." }, { status: 500 });
  }
}
