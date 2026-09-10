import { NextResponse } from "next/server";
import pool from "../../lib/db";
import { verifyPassword } from "../../lib/password";

export const dynamic = "force-dynamic";

function cleanNationalId(value) {
  return String(value || "").replace(/[^0-9]/g, "");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const nationalId = cleanNationalId(body?.national_id);
    const password = String(body?.password || "");
    const month = body?.month ? String(body.month).trim() : "";
    const year = body?.year ? String(body.year).trim() : "";

    if (nationalId.length !== 10 || !password) {
      return NextResponse.json({ success: false, error: "کد ملی یا رمز عبور اشتباه است." }, { status: 401 });
    }

    const employeeResult = await pool.query(
      `SELECT id, full_name, national_id, personnel_code, department, payslip_password
       FROM personnel WHERE national_id = $1 LIMIT 1`,
      [nationalId]
    );
    if (!employeeResult.rows.length) {
      return NextResponse.json({ success: false, error: "کد ملی یا رمز عبور اشتباه است." }, { status: 401 });
    }

    const employee = employeeResult.rows[0];
    const check = await verifyPassword(password, employee.payslip_password);
    if (!check.valid) {
      return NextResponse.json({ success: false, error: "کد ملی یا رمز عبور اشتباه است." }, { status: 401 });
    }

    if (check.needsUpgrade) {
      const { hashPassword } = await import("../../lib/password");
      await pool.query("UPDATE personnel SET payslip_password=$1 WHERE id=$2", [await hashPassword(password), employee.id]);
    }
    delete employee.payslip_password;

    if (!month || !year) {
      const monthsResult = await pool.query(
        `SELECT id, year, month, net_salary, created_at FROM payslips WHERE personnel_id=$1 ORDER BY id DESC`,
        [employee.id]
      );
      return NextResponse.json({ success: true, employee, months: monthsResult.rows });
    }

    const payslipResult = await pool.query(
      `SELECT p.id, p.personnel_id, p.year, p.month, p.bank_account, p.job_group, p.job_title,
              p.base_salary, p.overtime, p.bonus, p.housing_allowance, p.food_allowance,
              p.marriage_allowance, p.child_allowance, p.other_benefits, p.insurance, p.tax,
              p.other_deductions, p.net_salary, p.created_at,
              e.full_name, e.personnel_code, e.national_id, e.department,
              e.job_title AS employee_job_title
       FROM payslips p INNER JOIN personnel e ON p.personnel_id=e.id
       WHERE p.personnel_id=$1 AND p.month=$2 AND p.year=$3 ORDER BY p.id DESC`,
      [employee.id, month, year]
    );
    if (!payslipResult.rows.length) {
      return NextResponse.json({ success: false, error: "برای این ماه فیشی پیدا نشد." }, { status: 404 });
    }
    return NextResponse.json({ success: true, employee, data: payslipResult.rows });
  } catch (error) {
    console.error("PAYSLIP API ERROR:", error.message);
    return NextResponse.json({ success: false, error: "خطا در ارتباط با سامانه. لطفاً دوباره تلاش کنید." }, { status: 500 });
  }
}

// Backward compatibility is intentionally disabled: credentials must never be accepted in a URL query string.
export async function GET() {
  return NextResponse.json(
    { success: false, error: "روش درخواست نامعتبر است. ورود کارکنان باید با POST انجام شود." },
    { status: 405, headers: { Allow: "POST" } }
  );
}
