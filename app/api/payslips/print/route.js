import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import { requireAdmin } from "../../../lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const companyId = Number(body.company_id);
    const periodId = Number(body.payroll_period_id);
    const payslipIds = [...new Set((Array.isArray(body.payslip_ids) ? body.payslip_ids : []).map(Number).filter((id) => Number.isInteger(id) && id > 0))];

    if (!Number.isInteger(companyId) || companyId <= 0) return NextResponse.json({ success: false, error: "انتخاب شرکت الزامی است." }, { status: 400 });
    if (!Number.isInteger(periodId) || periodId <= 0) return NextResponse.json({ success: false, error: "انتخاب دوره حقوق الزامی است." }, { status: 400 });
    if (!payslipIds.length) return NextResponse.json({ success: false, error: "حداقل یک فیش باید انتخاب شود." }, { status: 400 });

    const company = await pool.query("SELECT id, name FROM companies WHERE id=$1 LIMIT 1", [companyId]);
    if (!company.rows.length) return NextResponse.json({ success: false, error: "شرکت انتخاب‌شده پیدا نشد." }, { status: 404 });

    const period = await pool.query(`SELECT id, company_id, year, month, status FROM payroll_periods WHERE id=$1 AND company_id=$2 LIMIT 1`, [periodId, companyId]);
    if (!period.rows.length) return NextResponse.json({ success: false, error: "این دوره متعلق به شرکت انتخاب‌شده نیست." }, { status: 403 });

    const result = await pool.query(`SELECT p.id, p.personnel_id, p.payroll_period_id, p.year, p.month, p.bank_account, p.job_group, p.job_title, p.base_salary, p.overtime, p.bonus, p.seniority_allowance, p.mission_allowance, p.work_days, p.mission_days, p.mission_hours, p.seniority_eligible, p.housing_allowance, p.food_allowance, p.marriage_allowance, p.child_allowance, p.other_benefits, p.insurance, p.tax, p.other_deductions, p.net_salary, p.created_at, e.full_name, e.personnel_code, e.national_id, e.department, e.job_title AS employee_job_title, e.company_id, c.name AS company_name, pp.status AS period_status, pp.company_id AS period_company_id FROM payslips p JOIN personnel e ON e.id=p.personnel_id JOIN companies c ON c.id=e.company_id JOIN payroll_periods pp ON pp.id=p.payroll_period_id WHERE p.id = ANY($1::int[]) AND e.company_id=$2 AND p.payroll_period_id=$3 AND pp.company_id=$2 ORDER BY p.id ASC`, [payslipIds, companyId, periodId]);

    if (result.rows.length !== payslipIds.length) return NextResponse.json({ success: false, error: "حداقل یک فیش با شرکت یا دوره انتخاب‌شده مطابقت ندارد؛ چاپ لغو شد." }, { status: 403 });

    return NextResponse.json({ success: true, meta: { company_id: companyId, company_name: company.rows[0].name, payroll_period_id: periodId, year: period.rows[0].year, month: period.rows[0].month, period_status: period.rows[0].status, count: result.rows.length }, data: result.rows });
  } catch (error) {
    console.error("POST payslip print validation error:", error);
    return NextResponse.json({ success: false, error: "خطا در تأیید فیش‌های انتخاب‌شده برای چاپ" }, { status: 500 });
  }
}
