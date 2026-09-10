import { NextResponse } from "next/server";
import pool from "../../lib/db";
import { requireAdmin } from "../../lib/admin-auth";

export const dynamic = "force-dynamic";

const PERSIAN_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
function normalizeMonth(value) {
  const raw = String(value ?? "").trim();
  const numeric = Number(raw);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 12) return numeric;
  const index = PERSIAN_MONTHS.indexOf(raw);
  return index >= 0 ? index + 1 : null;
}
function closedPeriodResponse() {
  return NextResponse.json({ success: false, error: "این فیش متعلق به دوره بسته است و ویرایش یا حذف آن مجاز نیست." }, { status: 409 });
}
function invalidPeriodResponse() {
  return NextResponse.json({ success: false, error: "دوره حقوق این شرکت پیدا نشد یا متعلق به شرکت دیگری است." }, { status: 409 });
}
async function getPayslipPeriod(id) {
  const result = await pool.query(`SELECT p.id, e.company_id, pp.company_id AS period_company_id, pp.status AS period_status FROM payslips p JOIN personnel e ON e.id=p.personnel_id LEFT JOIN payroll_periods pp ON pp.id=p.payroll_period_id WHERE p.id=$1`, [id]);
  return result.rows[0] || null;
}
async function getTargetPeriod(companyId, year, month) {
  const monthNumber = normalizeMonth(month);
  if (!monthNumber) return null;
  const result = await pool.query(`SELECT id, company_id, status FROM payroll_periods WHERE company_id=$1 AND year=$2 AND month=$3 LIMIT 1`, [companyId, Number(year), monthNumber]);
  return result.rows[0] || null;
}

export async function GET(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const year = searchParams.get("year") || "";
    const month = searchParams.get("month") || "";
    const values = [];
    let index = 1;
    let query = `SELECT p.id, p.personnel_id, p.payroll_period_id, p.year, p.month, p.bank_account, p.job_group, p.job_title, p.base_salary, p.overtime, p.bonus, p.housing_allowance, p.food_allowance, p.marriage_allowance, p.child_allowance, p.other_benefits, p.insurance, p.tax, p.other_deductions, p.net_salary, p.created_at, e.full_name, e.national_id, e.personnel_code, e.department, e.job_title AS employee_job_title, e.company_id, c.name AS company_name, pp.status AS period_status FROM payslips p LEFT JOIN personnel e ON p.personnel_id=e.id LEFT JOIN companies c ON e.company_id=c.id LEFT JOIN payroll_periods pp ON p.payroll_period_id=pp.id WHERE 1=1`;
    if (search.trim()) { query += ` AND (e.full_name ILIKE $${index} OR e.personnel_code ILIKE $${index} OR e.national_id ILIKE $${index})`; values.push(`%${search.trim()}%`); index++; }
    if (year.trim()) { query += ` AND p.year=$${index}`; values.push(year.trim()); index++; }
    if (month.trim()) { query += ` AND p.month=$${index}`; values.push(month.trim()); index++; }
    query += " ORDER BY p.id DESC";
    const result = await pool.query(query, values);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("GET corrections error:", error);
    return NextResponse.json({ success: false, error: "خطا در دریافت اصلاحات" }, { status: 500 });
  }
}

export async function PUT(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ success: false, error: "شناسه فیش وارد نشده است." }, { status: 400 });
    const existing = await getPayslipPeriod(id);
    if (!existing) return NextResponse.json({ success: false, error: "فیش موردنظر پیدا نشد." }, { status: 404 });
    if (existing.period_status === "closed") return closedPeriodResponse();
    if (existing.period_company_id && Number(existing.period_company_id) !== Number(existing.company_id)) return NextResponse.json({ success: false, error: "ساختار شرکت فیش نامعتبر است." }, { status: 409 });

    const year = String(body.year || "1405").trim();
    const month = normalizeMonth(body.month);
    if (!/^\d{4}$/.test(year) || !month) return NextResponse.json({ success: false, error: "سال یا ماه دوره نامعتبر است." }, { status: 400 });
    const targetPeriod = await getTargetPeriod(existing.company_id, year, month);
    if (!targetPeriod) return invalidPeriodResponse();
    if (targetPeriod.status === "closed") return closedPeriodResponse();

    const base = Number(body.base_salary) || 0;
    if (base <= 0) return NextResponse.json({ success: false, error: "حقوق پایه باید بیشتر از صفر باشد." }, { status: 400 });
    const overtime = Number(body.overtime) || 0, bonus = Number(body.bonus) || 0, housing = Number(body.housing_allowance) || 0, food = Number(body.food_allowance) || 0, marriage = Number(body.marriage_allowance) || 0, child = Number(body.child_allowance) || 0, otherBenefits = Number(body.other_benefits) || 0, insurance = Number(body.insurance) || 0, tax = Number(body.tax) || 0, otherDeductions = Number(body.other_deductions) || 0;
    const totalBenefits = overtime + bonus + housing + food + marriage + child + otherBenefits;
    const totalDeductions = insurance + tax + otherDeductions;
    const netSalary = base + totalBenefits - totalDeductions;
    const result = await pool.query(`UPDATE payslips SET payroll_period_id=$1, year=$2, month=$3, bank_account=$4, job_group=$5, job_title=$6, base_salary=$7, overtime=$8, bonus=$9, housing_allowance=$10, food_allowance=$11, marriage_allowance=$12, child_allowance=$13, other_benefits=$14, insurance=$15, tax=$16, other_deductions=$17, net_salary=$18 WHERE id=$19 RETURNING *`, [targetPeriod.id, year, month, body.bank_account || "", body.job_group || "", body.job_title || "", base, overtime, bonus, housing, food, marriage, child, otherBenefits, insurance, tax, otherDeductions, netSalary, id]);
    return NextResponse.json({ success: true, message: "فیش حقوقی با موفقیت اصلاح شد.", data: result.rows[0], calculation: { totalBenefits, totalDeductions, netSalary } });
  } catch (error) {
    console.error("PUT corrections error:", error);
    return NextResponse.json({ success: false, error: "خطا در اصلاح فیش" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ success: false, error: "شناسه فیش وارد نشده است." }, { status: 400 });
    const existing = await getPayslipPeriod(id);
    if (!existing) return NextResponse.json({ success: false, error: "فیش موردنظر پیدا نشد." }, { status: 404 });
    if (existing.period_status === "closed") return closedPeriodResponse();
    if (existing.period_company_id && Number(existing.period_company_id) !== Number(existing.company_id)) return NextResponse.json({ success: false, error: "ساختار شرکت فیش نامعتبر است." }, { status: 409 });
    const result = await pool.query("DELETE FROM payslips WHERE id=$1 RETURNING id", [id]);
    if (!result.rows.length) return NextResponse.json({ success: false, error: "فیش موردنظر پیدا نشد." }, { status: 404 });
    return NextResponse.json({ success: true, message: "فیش حقوقی با موفقیت حذف شد." });
  } catch (error) {
    console.error("DELETE corrections error:", error);
    return NextResponse.json({ success: false, error: "خطا در حذف فیش" }, { status: 500 });
  }
}
