import { NextResponse } from "next/server";
import pool from "../../lib/db";
import { requireAdmin } from "../../lib/admin-auth";

export const dynamic = "force-dynamic";

const PERSIAN_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
let schemaReady;
async function ensurePayslipColumns() {
  if (!schemaReady) {
    schemaReady = pool.query(`ALTER TABLE payslips ADD COLUMN IF NOT EXISTS seniority_allowance NUMERIC DEFAULT 0, ADD COLUMN IF NOT EXISTS mission_allowance NUMERIC DEFAULT 0`).catch((error) => { schemaReady = null; throw error; });
  }
  return schemaReady;
}
function toNumber(value) { const n = Number(value); return Number.isFinite(n) ? n : 0; }
function normalizeMonth(value) { const raw = String(value ?? "").trim(); const numeric = Number(raw); if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 12) return numeric; const index = PERSIAN_MONTHS.indexOf(raw); return index >= 0 ? index + 1 : null; }
function calculate(body) {
  const base = toNumber(body.base_salary), overtime = toNumber(body.overtime), bonus = toNumber(body.bonus);
  const seniority = toNumber(body.seniority_allowance), mission = toNumber(body.mission_allowance);
  const housing = toNumber(body.housing_allowance), food = toNumber(body.food_allowance), marriage = toNumber(body.marriage_allowance), child = toNumber(body.child_allowance), otherBenefits = toNumber(body.other_benefits);
  const insurance = toNumber(body.insurance), tax = toNumber(body.tax), otherDeductions = toNumber(body.other_deductions);
  const totalBenefits = overtime + bonus + seniority + mission + housing + food + marriage + child + otherBenefits;
  const totalDeductions = insurance + tax + otherDeductions;
  return { base, overtime, bonus, seniority, mission, housing, food, marriage, child, otherBenefits, insurance, tax, otherDeductions, totalBenefits, totalDeductions, netSalary: base + totalBenefits - totalDeductions };
}
async function getEmployee(personnelId) { const result = await pool.query(`SELECT id, full_name, personnel_code, national_id, department, job_title, bank_account, job_group, company_id FROM personnel WHERE id=$1`, [personnelId]); return result.rows[0] || null; }
async function getPeriod(companyId, year, month) { const monthNumber = normalizeMonth(month); if (!monthNumber) return null; const result = await pool.query(`SELECT id, company_id, status FROM payroll_periods WHERE company_id=$1 AND year=$2 AND month=$3 LIMIT 1`, [companyId, Number(year), monthNumber]); return result.rows[0] || null; }
async function getPayslipWithPeriod(payslipId) { const result = await pool.query(`SELECT p.id, p.personnel_id, p.payroll_period_id, e.company_id, pp.company_id AS period_company_id, pp.status AS period_status FROM payslips p JOIN personnel e ON e.id=p.personnel_id LEFT JOIN payroll_periods pp ON pp.id=p.payroll_period_id WHERE p.id=$1`, [payslipId]); return result.rows[0] || null; }
function closedPeriodResponse() { return NextResponse.json({ success: false, error: "این فیش متعلق به دوره بسته است و ویرایش یا حذف آن مجاز نیست." }, { status: 409 }); }
function invalidPeriodResponse() { return NextResponse.json({ success: false, error: "دوره حقوق این شرکت پیدا نشد یا متعلق به شرکت دیگری است." }, { status: 409 }); }
function crossCompanyResponse() { return NextResponse.json({ success: false, error: "انتقال فیش بین شرکت‌ها مجاز نیست." }, { status: 403 }); }

export async function GET(request) {
  const authError = requireAdmin(request); if (authError) return authError;
  try {
    await ensurePayslipColumns();
    const searchParams = new URL(request.url).searchParams;
    const companyId = Number(searchParams.get("company_id"));
    if (!Number.isInteger(companyId) || companyId <= 0) return NextResponse.json({ success: false, error: "انتخاب شرکت برای مشاهده فیش‌ها الزامی است." }, { status: 400 });
    const companyResult = await pool.query(`SELECT id, name FROM companies WHERE id=$1 LIMIT 1`, [companyId]);
    if (!companyResult.rows.length) return NextResponse.json({ success: false, error: "شرکت انتخاب‌شده پیدا نشد." }, { status: 404 });
    const result = await pool.query(`SELECT p.id, p.personnel_id, p.payroll_period_id, p.year, p.month, p.bank_account, p.job_group, p.job_title, p.base_salary, p.overtime, p.bonus, p.seniority_allowance, p.mission_allowance, p.housing_allowance, p.food_allowance, p.marriage_allowance, p.child_allowance, p.other_benefits, p.insurance, p.tax, p.other_deductions, p.net_salary, p.created_at, e.full_name, e.personnel_code, e.national_id, e.department, e.job_title AS employee_job_title, e.company_id, c.name AS company_name, pp.status AS period_status FROM payslips p JOIN personnel e ON p.personnel_id=e.id LEFT JOIN companies c ON e.company_id=c.id LEFT JOIN payroll_periods pp ON p.payroll_period_id=pp.id WHERE e.company_id=$1 ORDER BY p.id DESC`, [companyId]);
    return NextResponse.json({ success: true, company: companyResult.rows[0], data: result.rows });
  } catch (error) { console.error("GET payslips error:", error); return NextResponse.json({ success: false, error: "خطا در دریافت فیش‌ها" }, { status: 500 }); }
}

export async function POST(request) {
  const authError = requireAdmin(request); if (authError) return authError;
  try {
    await ensurePayslipColumns();
    const body = await request.json(); const personnelId = Number(body.personnel_id);
    if (!Number.isInteger(personnelId) || personnelId <= 0) return NextResponse.json({ success: false, error: "لطفاً کارمند را انتخاب کنید." }, { status: 400 });
    const employee = await getEmployee(personnelId); if (!employee) return NextResponse.json({ success: false, error: "کارمند انتخاب شده وجود ندارد." }, { status: 400 });
    const year = String(body.year ?? "1405").trim(), month = String(body.month ?? "فروردین").trim();
    const period = await getPeriod(employee.company_id, year, month);
    if (!period) return invalidPeriodResponse(); if (period.status === "closed") return closedPeriodResponse();
    const calc = calculate(body); if (calc.base <= 0) return NextResponse.json({ success: false, error: "حقوق پایه باید بیشتر از صفر باشد." }, { status: 400 });
    const result = await pool.query(`INSERT INTO payslips (personnel_id,payroll_period_id,year,month,bank_account,job_group,job_title,base_salary,overtime,bonus,seniority_allowance,mission_allowance,housing_allowance,food_allowance,marriage_allowance,child_allowance,other_benefits,insurance,tax,other_deductions,net_salary) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING *`, [personnelId, period.id, year, month, body.bank_account ?? employee.bank_account ?? "", body.job_group ?? employee.job_group ?? "", body.job_title ?? employee.job_title ?? "", calc.base, calc.overtime, calc.bonus, calc.seniority, calc.mission, calc.housing, calc.food, calc.marriage, calc.child, calc.otherBenefits, calc.insurance, calc.tax, calc.otherDeductions, calc.netSalary]);
    return NextResponse.json({ success: true, message: "فیش حقوقی با موفقیت ثبت و صادر شد.", data: result.rows[0] }, { status: 201 });
  } catch (error) { console.error("POST payslips error:", error); return NextResponse.json({ success: false, error: "خطا در ثبت فیش حقوقی" }, { status: 500 }); }
}

export async function PUT(request) {
  const authError = requireAdmin(request); if (authError) return authError;
  try {
    await ensurePayslipColumns();
    const body = await request.json(); const payslipId = Number(body.id), personnelId = Number(body.personnel_id);
    if (!Number.isInteger(payslipId) || payslipId <= 0) return NextResponse.json({ success: false, error: "شناسه فیش مشخص نشده است." }, { status: 400 });
    if (!Number.isInteger(personnelId) || personnelId <= 0) return NextResponse.json({ success: false, error: "لطفاً کارمند را انتخاب کنید." }, { status: 400 });
    const existing = await getPayslipWithPeriod(payslipId); if (!existing) return NextResponse.json({ success: false, error: "فیش موردنظر پیدا نشد." }, { status: 404 });
    if (existing.period_status === "closed") return closedPeriodResponse();
    const employee = await getEmployee(personnelId); if (!employee) return NextResponse.json({ success: false, error: "کارمند انتخاب شده وجود ندارد." }, { status: 400 });
    if (existing.company_id && Number(existing.company_id) !== Number(employee.company_id)) return crossCompanyResponse();
    if (existing.period_company_id && Number(existing.period_company_id) !== Number(employee.company_id)) return crossCompanyResponse();
    const year = String(body.year ?? "1405").trim(), month = String(body.month ?? "فروردین").trim();
    const period = await getPeriod(employee.company_id, year, month);
    if (!period) return invalidPeriodResponse(); if (period.status === "closed") return closedPeriodResponse();
    const calc = calculate(body); if (calc.base <= 0) return NextResponse.json({ success: false, error: "حقوق پایه باید بیشتر از صفر باشد." }, { status: 400 });
    const result = await pool.query(`UPDATE payslips SET personnel_id=$1,payroll_period_id=$2,year=$3,month=$4,bank_account=$5,job_group=$6,job_title=$7,base_salary=$8,overtime=$9,bonus=$10,seniority_allowance=$11,mission_allowance=$12,housing_allowance=$13,food_allowance=$14,marriage_allowance=$15,child_allowance=$16,other_benefits=$17,insurance=$18,tax=$19,other_deductions=$20,net_salary=$21 WHERE id=$22 RETURNING *`, [personnelId, period.id, year, month, body.bank_account ?? employee.bank_account ?? "", body.job_group ?? employee.job_group ?? "", body.job_title ?? employee.job_title ?? "", calc.base, calc.overtime, calc.bonus, calc.seniority, calc.mission, calc.housing, calc.food, calc.marriage, calc.child, calc.otherBenefits, calc.insurance, calc.tax, calc.otherDeductions, calc.netSalary, payslipId]);
    return NextResponse.json({ success: true, message: "فیش حقوقی با موفقیت ویرایش شد.", data: result.rows[0] });
  } catch (error) { console.error("PUT payslips error:", error); return NextResponse.json({ success: false, error: "خطا در ویرایش فیش حقوقی" }, { status: 500 }); }
}

export async function DELETE(request) {
  const authError = requireAdmin(request); if (authError) return authError;
  try {
    await ensurePayslipColumns();
    const body = await request.json(); const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ success: false, error: "شناسه فیش مشخص نشده است." }, { status: 400 });
    const existing = await getPayslipWithPeriod(id); if (!existing) return NextResponse.json({ success: false, error: "فیش موردنظر پیدا نشد." }, { status: 404 });
    if (existing.period_status === "closed") return closedPeriodResponse();
    const result = await pool.query("DELETE FROM payslips WHERE id=$1 RETURNING id", [id]);
    if (!result.rows.length) return NextResponse.json({ success: false, error: "فیش موردنظر پیدا نشد." }, { status: 404 });
    return NextResponse.json({ success: true, message: "فیش حقوقی با موفقیت حذف شد." });
  } catch (error) { console.error("DELETE payslips error:", error); return NextResponse.json({ success: false, error: "خطا در حذف فیش حقوقی" }, { status: 500 }); }
}