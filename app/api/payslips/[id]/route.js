import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import { requireAdmin } from "../../../lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const id = Number(params?.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ success: false, error: "شناسه فیش نامعتبر است." }, { status: 400 });
    }

    const result = await pool.query(`
      SELECT
        p.id, p.personnel_id, p.payroll_period_id, p.year, p.month,
        p.bank_account, p.job_group, p.job_title, p.base_salary, p.overtime,
        p.bonus, p.seniority_allowance, p.mission_allowance, p.work_days,
        p.mission_days, p.mission_hours, p.seniority_eligible,
        p.housing_allowance, p.food_allowance, p.marriage_allowance,
        p.child_allowance, p.other_benefits, p.insurance, p.tax,
        p.other_deductions, p.net_salary, p.created_at,
        e.full_name, e.personnel_code, e.national_id, e.department,
        e.job_title AS employee_job_title, e.company_id,
        c.name AS company_name, pp.status AS period_status
      FROM payslips p
      JOIN personnel e ON e.id=p.personnel_id
      LEFT JOIN companies c ON c.id=e.company_id
      LEFT JOIN payroll_periods pp ON pp.id=p.payroll_period_id
      WHERE p.id=$1
      LIMIT 1
    `, [id]);

    if (!result.rows.length) {
      return NextResponse.json({ success: false, error: "فیش موردنظر پیدا نشد." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: [result.rows[0]] });
  } catch (error) {
    console.error("GET single payslip error:", error);
    return NextResponse.json({ success: false, error: "خطا در دریافت فیش" }, { status: 500 });
  }
}
