import { NextResponse } from "next/server";
import pool from "../../lib/db";
import { requireAdmin } from "../../lib/admin-auth";
import { calculatePayroll1405 } from "../../lib/payroll-1405";
import { normalizePayslipMonth } from "../../lib/payslip-month";

export const dynamic = "force-dynamic";
let schemaReady;

async function ensurePayslipColumns() {
  if (!schemaReady) schemaReady = pool.query(`ALTER TABLE payslips ADD COLUMN IF NOT EXISTS seniority_allowance NUMERIC DEFAULT 0, ADD COLUMN IF NOT EXISTS past_seniority_allowance NUMERIC DEFAULT 0, ADD COLUMN IF NOT EXISTS mission_allowance NUMERIC DEFAULT 0, ADD COLUMN IF NOT EXISTS work_days NUMERIC DEFAULT 30, ADD COLUMN IF NOT EXISTS mission_days NUMERIC DEFAULT 0, ADD COLUMN IF NOT EXISTS mission_hours NUMERIC DEFAULT 0, ADD COLUMN IF NOT EXISTS seniority_eligible BOOLEAN DEFAULT false`).catch((error) => { schemaReady = null; throw error; });
  return schemaReady;
}
async function getEmployee(id) { const result = await pool.query(`SELECT id, full_name, personnel_code, national_id, department, job_title, bank_account, job_group, company_id FROM personnel WHERE id=$1`, [id]); return result.rows[0] || null; }
async function getPeriod(companyId, year, month) { const monthNumber = normalizePayslipMonth(month); if (!monthNumber) return null; const result = await pool.query(`SELECT id, company_id, status FROM payroll_periods WHERE company_id=$1 AND year=$2 AND month=$3 LIMIT 1`, [companyId, Number(year), monthNumber]); return result.rows[0] || null; }
async function getPayslipWithPeriod(id) { const result = await pool.query(`SELECT p.id, p.personnel_id, p.payroll_period_id, e.company_id, pp.company_id AS period_company_id, pp.status AS period_status FROM payslips p JOIN personnel e ON e.id=p.personnel_id LEFT JOIN payroll_periods pp ON pp.id=p.payroll_period_id WHERE p.id=$1`, [id]); return result.rows[0] || null; }
function closedPeriodResponse() { return NextResponse.json({ success: false, error: "این فیش متعلق به دوره بسته است و ویرایش یا حذف آن مجاز نیست." }, { status: 409 }); }
function invalidPeriodResponse() { return NextResponse.json({ success: false, error: "دوره حقوق این شرکت پیدا نشد یا متعلق به شرکت دیگری است." }, { status: 409 }); }
function crossCompanyResponse() { return NextResponse.json({ success: false, error: "انتقال فیش بین شرکت‌ها مجاز نیست." }, { status: 403 }); }
function prepareCalculation(body) { const monthNumber = normalizePayslipMonth(body.month); if (!monthNumber) return { error: "ماه حقوق نامعتبر است." }; if (Number(body.year || 1405) !== 1405) return { error: "موتور محاسبه این نسخه فعلاً مخصوص سال ۱۴۰۵ است." }; const calc = calculatePayroll1405({ ...body, year: 1405, monthNumber }); if (calc.baseSalary <= 0) return { error: "حقوق پایه باید بیشتر از صفر باشد." }; return { calc }; }

export async function GET(request) {
  const authError = requireAdmin(request); if (authError) return authError;
  try {
    await ensurePayslipColumns();
    const params = new URL(request.url).searchParams;
    const companyId = Number(params.get("company_id"));
    if (!Number.isInteger(companyId) || companyId <= 0) return NextResponse.json({ success: false, error: "انتخاب شرکت برای مشاهده فیش‌ها الزامی است." }, { status: 400 });

    const companyResult = await pool.query("SELECT id, name FROM companies WHERE id=$1 LIMIT 1", [companyId]);
    if (!companyResult.rows.length) return NextResponse.json({ success: false, error: "شرکت انتخاب‌شده پیدا نشد." }, { status: 404 });

    const page = Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1);
    const pageSize = Math.min(50, Math.max(1, Number.parseInt(params.get("page_size") || "20", 10) || 20));
    const search = String(params.get("q") || "").trim();
    const yearParam = String(params.get("year") || "").trim();
    const monthParam = String(params.get("month") || "").trim();
    const groupParam = String(params.get("job_group") || "").trim();
    const statusParam = String(params.get("status") || "all").trim();

    const where = ["e.company_id=$1"];
    const values = [companyId];
    const add = (sql, value) => {
      values.push(value);
      const index = values.length;
      where.push(sql.replaceAll("?", `$\${index}`));
    };

    if (search) add("(e.full_name ILIKE ? OR e.personnel_code ILIKE ? OR CAST(p.id AS TEXT) ILIKE ?)", `%\${search}%`);

    if (yearParam) {
      const year = Number(yearParam);
      if (!Number.isInteger(year)) return NextResponse.json({ success: false, error: "سال پرداخت نامعتبر است." }, { status: 400 });
      add("p.year=?", year);
    }

    if (monthParam) {
      const monthNumber = normalizePayslipMonth(monthParam);
      if (!monthNumber) return NextResponse.json({ success: false, error: "ماه پرداخت نامعتبر است." }, { status: 400 });
      add("p.month=?", monthNumber);
    }

    if (groupParam) add("CAST(p.job_group AS TEXT)=?", groupParam);

    if (statusParam && statusParam !== "all") {
      if (!["open", "closed"].includes(statusParam)) return NextResponse.json({ success: false, error: "وضعیت فیلتر نامعتبر است." }, { status: 400 });
      add("pp.status=?", statusParam);
    }

    const whereSql = where.join(" AND ");
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total, COALESCE(SUM(p.net_salary),0) AS total_net
       FROM payslips p
       JOIN personnel e ON p.personnel_id=e.id
       LEFT JOIN payroll_periods pp ON p.payroll_period_id=pp.id
       WHERE ${whereSql}`,
      values
    );

    const total = Number(countResult.rows[0]?.total || 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * pageSize;
    const limitIndex = values.length + 1;
    const offsetIndex = values.length + 2;
    const result = await pool.query(
      `SELECT
        p.id,p.personnel_id,p.year,p.month,p.job_group,p.work_days,p.net_salary,p.created_at,
        e.full_name,e.personnel_code,pp.status AS period_status
       FROM payslips p
       JOIN personnel e ON p.personnel_id=e.id
       LEFT JOIN payroll_periods pp ON p.payroll_period_id=pp.id
       WHERE ${whereSql}
       ORDER BY p.id DESC
       LIMIT ${limitIndex} OFFSET ${offsetIndex}`,
      [...values, pageSize, offset]
    );

    return NextResponse.json({
      success: true,
      company: companyResult.rows[0],
      data: result.rows,
      meta: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.max(1, Math.ceil(total / pageSize)),
        total_net: countResult.rows[0]?.total_net || 0,
      },
    });
  } catch (error) { console.error("GET payslips error:", error); return NextResponse.json({ success: false, error: "خطا در دریافت فیش‌ها" }, { status: 500 }); }
}

export async function POST(request) {
  const authError = requireAdmin(request); if (authError) return authError;
  try {
    await ensurePayslipColumns(); const body = await request.json(); const personnelId = Number(body.personnel_id);
    if (!Number.isInteger(personnelId) || personnelId <= 0) return NextResponse.json({ success: false, error: "لطفاً کارمند را انتخاب کنید." }, { status: 400 });
    const employee = await getEmployee(personnelId); if (!employee) return NextResponse.json({ success: false, error: "کارمند انتخاب شده وجود ندارد." }, { status: 400 });
    const year = String(body.year ?? "1405").trim(), month = String(body.month ?? "فروردین").trim(); const monthNumber = normalizePayslipMonth(month); const period = await getPeriod(employee.company_id, year, month);
    if (!monthNumber) return NextResponse.json({ success: false, error: "ماه حقوق نامعتبر است." }, { status: 400 });
    if (!period) return invalidPeriodResponse(); if (period.status === "closed") return closedPeriodResponse();
    const payrollBody = { ...body, bank_account: employee.bank_account ?? "", job_group: employee.job_group, job_title: employee.job_title };
    const prepared = prepareCalculation(payrollBody); if (prepared.error) return NextResponse.json({ success: false, error: prepared.error }, { status: 400 }); const c = prepared.calc;
    const result = await pool.query(`INSERT INTO payslips (personnel_id,payroll_period_id,year,month,bank_account,job_group,job_title,base_salary,overtime,bonus,seniority_allowance,past_seniority_allowance,mission_allowance,work_days,mission_days,mission_hours,seniority_eligible,housing_allowance,food_allowance,marriage_allowance,child_allowance,other_benefits,insurance,tax,other_deductions,net_salary) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26) RETURNING *`, [personnelId,period.id,year,monthNumber,employee.bank_account ?? "",employee.job_group ?? "",employee.job_title ?? "",c.baseSalary,c.overtime,c.bonus,c.seniorityAllowance,c.pastSeniorityAllowance,c.missionAllowance,c.workDays,c.missionDays,c.missionHours,c.seniorityEligible,c.housingAllowance,c.foodAllowance,c.marriageAllowance,c.childAllowance,c.otherBenefits,c.insurance,c.tax,c.otherDeductions,c.netSalary]);
    return NextResponse.json({ success: true, message: "فیش حقوقی با موتور محاسبه یکپارچه ۱۴۰۵ صادر شد.", data: result.rows[0], calculation: c }, { status: 201 });
  } catch (error) { console.error("POST payslips error:", error); return NextResponse.json({ success: false, error: "خطا در ثبت فیش حقوقی" }, { status: 500 }); }
}

export async function PUT(request) {
  const authError = requireAdmin(request); if (authError) return authError;
  try {
    await ensurePayslipColumns(); const body = await request.json(); const payslipId = Number(body.id), personnelId = Number(body.personnel_id);
    if (!Number.isInteger(payslipId) || payslipId <= 0) return NextResponse.json({ success: false, error: "شناسه فیش مشخص نشده است." }, { status: 400 }); if (!Number.isInteger(personnelId) || personnelId <= 0) return NextResponse.json({ success: false, error: "لطفاً کارمند را انتخاب کنید." }, { status: 400 });
    const existing = await getPayslipWithPeriod(payslipId); if (!existing) return NextResponse.json({ success: false, error: "فیش موردنظر پیدا نشد." }, { status: 404 }); if (existing.period_status === "closed") return closedPeriodResponse();
    const employee = await getEmployee(personnelId); if (!employee) return NextResponse.json({ success: false, error: "کارمند انتخاب شده وجود ندارد." }, { status: 400 }); if (existing.company_id && Number(existing.company_id) !== Number(employee.company_id)) return crossCompanyResponse(); if (existing.period_company_id && Number(existing.period_company_id) !== Number(employee.company_id)) return crossCompanyResponse();
    const year = String(body.year ?? "1405").trim(), month = String(body.month ?? "فروردین").trim(); const monthNumber = normalizePayslipMonth(month); const period = await getPeriod(employee.company_id, year, month); if (!monthNumber) return NextResponse.json({ success: false, error: "ماه حقوق نامعتبر است." }, { status: 400 }); if (!period) return invalidPeriodResponse(); if (period.status === "closed") return closedPeriodResponse();
    const payrollBody = { ...body, bank_account: employee.bank_account ?? "", job_group: employee.job_group, job_title: employee.job_title };
    const prepared = prepareCalculation(payrollBody); if (prepared.error) return NextResponse.json({ success: false, error: prepared.error }, { status: 400 }); const c = prepared.calc;
    const result = await pool.query(`UPDATE payslips SET personnel_id=$1,payroll_period_id=$2,year=$3,month=$4,bank_account=$5,job_group=$6,job_title=$7,base_salary=$8,overtime=$9,bonus=$10,seniority_allowance=$11,past_seniority_allowance=$12,mission_allowance=$13,work_days=$14,mission_days=$15,mission_hours=$16,seniority_eligible=$17,housing_allowance=$18,food_allowance=$19,marriage_allowance=$20,child_allowance=$21,other_benefits=$22,insurance=$23,tax=$24,other_deductions=$25,net_salary=$26 WHERE id=$27 RETURNING *`, [personnelId,period.id,year,monthNumber,employee.bank_account ?? "",employee.job_group ?? "",employee.job_title ?? "",c.baseSalary,c.overtime,c.bonus,c.seniorityAllowance,c.pastSeniorityAllowance,c.missionAllowance,c.workDays,c.missionDays,c.missionHours,c.seniorityEligible,c.housingAllowance,c.foodAllowance,c.marriageAllowance,c.childAllowance,c.otherBenefits,c.insurance,c.tax,c.otherDeductions,c.netSalary,payslipId]);
    return NextResponse.json({ success: true, message: "فیش حقوقی با موتور محاسبه یکپارچه ۱۴۰۵ ویرایش شد.", data: result.rows[0], calculation: c });
  } catch (error) { console.error("PUT payslips error:", error); return NextResponse.json({ success: false, error: "خطا در ویرایش فیش حقوقی" }, { status: 500 }); }
}

export async function DELETE(request) {
  const authError = requireAdmin(request); if (authError) return authError;
  try {
    await ensurePayslipColumns(); const body = await request.json(); const id = Number(body.id); if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ success: false, error: "شناسه فیش مشخص نشده است." }, { status: 400 });
    const existing = await getPayslipWithPeriod(id); if (!existing) return NextResponse.json({ success: false, error: "فیش موردنظر پیدا نشد." }, { status: 404 }); if (existing.period_status === "closed") return closedPeriodResponse();
    const result = await pool.query("DELETE FROM payslips WHERE id=$1 RETURNING id", [id]); if (!result.rows.length) return NextResponse.json({ success: false, error: "فیش موردنظر پیدا نشد." }, { status: 404 });
    return NextResponse.json({ success: true, message: "فیش حقوقی با موفقیت حذف شد." });
  } catch (error) { console.error("DELETE payslips error:", error); return NextResponse.json({ success: false, error: "خطا در حذف فیش حقوقی" }, { status: 500 }); }
}
