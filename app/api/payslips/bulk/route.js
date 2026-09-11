import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import { requireAdmin } from "../../../lib/admin-auth";

export const dynamic = "force-dynamic";

const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const STANDARD_HOURS_PER_DAY = 7.33;
const DEFAULT_SENIORITY_DAILY_RATE = 16667;

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeMonth(value) {
  const raw = String(value ?? "").trim();
  const numeric = Number(raw);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 12) return numeric;
  const index = MONTHS.indexOf(raw);
  return index >= 0 ? index + 1 : null;
}

async function ensureColumns() {
  await pool.query(`
    ALTER TABLE payslips
      ADD COLUMN IF NOT EXISTS seniority_allowance NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS mission_allowance NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS work_days NUMERIC DEFAULT 30,
      ADD COLUMN IF NOT EXISTS mission_days NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS mission_hours NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS seniority_eligible BOOLEAN DEFAULT false
  `);
}

async function getSettings(client) {
  try {
    const result = await client.query("SELECT seniority_daily_rate FROM settings ORDER BY id ASC LIMIT 1");
    const rate = num(result.rows[0]?.seniority_daily_rate);
    return rate > 0 ? rate : DEFAULT_SENIORITY_DAILY_RATE;
  } catch {
    return DEFAULT_SENIORITY_DAILY_RATE;
  }
}

function calculate({ baseSalary, workDays, missionDays, missionHours, seniorityEligible, overtime, bonus, housing, food, marriage, child, otherBenefits, insurance, tax, otherDeductions }, seniorityDailyRate) {
  const base = num(baseSalary);
  const days = Math.min(31, Math.max(1, num(workDays) || 30));
  const mDays = Math.min(days, Math.max(0, num(missionDays)));
  const mHours = Math.min(days * 24, Math.max(0, num(missionHours)));
  const dailyWage = base / days;
  const hourlyWage = dailyWage / STANDARD_HOURS_PER_DAY;
  const mission = mDays * dailyWage + mHours * hourlyWage;
  const seniority = seniorityEligible ? days * seniorityDailyRate : 0;
  const benefits = num(overtime) + num(bonus) + mission + seniority + num(housing) + num(food) + num(marriage) + num(child) + num(otherBenefits);
  const deductions = num(insurance) + num(tax) + num(otherDeductions);
  return { base, days, mDays, mHours, dailyWage, hourlyWage, mission, seniority, benefits, deductions, netSalary: base + benefits - deductions };
}

export async function POST(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const client = await pool.connect();
  try {
    await ensureColumns();
    const body = await request.json();
    const companyId = Number(body.company_id);
    const periodId = Number(body.payroll_period_id);
    const employeeIds = Array.isArray(body.employee_ids) ? [...new Set(body.employee_ids.map(Number).filter((id) => Number.isInteger(id) && id > 0))] : [];
    const year = String(body.year ?? "1405").trim();
    const month = String(body.month ?? "").trim();
    const monthNumber = normalizeMonth(month);

    if (!Number.isInteger(companyId) || companyId <= 0) return NextResponse.json({ success: false, error: "شرکت انتخاب نشده است." }, { status: 400 });
    if (!Number.isInteger(periodId) || periodId <= 0) return NextResponse.json({ success: false, error: "دوره حقوق انتخاب نشده است." }, { status: 400 });
    if (!employeeIds.length) return NextResponse.json({ success: false, error: "حداقل یک کارمند را انتخاب کنید." }, { status: 400 });
    if (!monthNumber) return NextResponse.json({ success: false, error: "ماه حقوق نامعتبر است." }, { status: 400 });

    await client.query("BEGIN");
    const periodResult = await client.query(`SELECT id, company_id, year, month, status FROM payroll_periods WHERE id=$1 FOR UPDATE`, [periodId]);
    const period = periodResult.rows[0];
    if (!period || Number(period.company_id) !== companyId || Number(period.year) !== Number(year) || Number(period.month) !== monthNumber) {
      await client.query("ROLLBACK");
      return NextResponse.json({ success: false, error: "دوره حقوق انتخاب‌شده با شرکت یا ماه انتخابی همخوانی ندارد." }, { status: 409 });
    }
    if (period.status === "closed") {
      await client.query("ROLLBACK");
      return NextResponse.json({ success: false, error: "این دوره حقوق بسته است و صدور فیش جدید مجاز نیست." }, { status: 409 });
    }

    const employeesResult = await client.query(
      `SELECT id, full_name, personnel_code, company_id, bank_account, job_group, job_title
       FROM personnel WHERE company_id=$1 AND id = ANY($2::int[]) ORDER BY id`,
      [companyId, employeeIds]
    );
    const employees = employeesResult.rows;
    if (employees.length !== employeeIds.length) {
      await client.query("ROLLBACK");
      return NextResponse.json({ success: false, error: "یک یا چند کارمند متعلق به شرکت انتخاب‌شده نیستند یا پیدا نشدند." }, { status: 409 });
    }

    const settingsRate = await getSettings(client);
    const common = body.defaults && typeof body.defaults === "object" ? body.defaults : body;
    const overrides = body.overrides && typeof body.overrides === "object" ? body.overrides : {};
    const results = [];
    let created = 0;
    let skipped = 0;

    for (const employee of employees) {
      const existing = await client.query(`SELECT id FROM payslips WHERE personnel_id=$1 AND payroll_period_id=$2 LIMIT 1`, [employee.id, periodId]);
      if (existing.rowCount) {
        skipped += 1;
        results.push({ employee_id: employee.id, personnel_code: employee.personnel_code, full_name: employee.full_name, status: "skipped", reason: "برای این کارمند در این دوره فیش قبلاً صادر شده است.", payslip_id: existing.rows[0].id });
        continue;
      }

      const override = overrides[String(employee.id)] && typeof overrides[String(employee.id)] === "object" ? overrides[String(employee.id)] : {};
      const calc = calculate({
        baseSalary: override.base_salary ?? common.base_salary,
        workDays: override.work_days ?? common.work_days,
        missionDays: override.mission_days ?? common.mission_days,
        missionHours: override.mission_hours ?? common.mission_hours,
        seniorityEligible: override.seniority_eligible ?? common.seniority_eligible,
        overtime: override.overtime ?? common.overtime,
        bonus: override.bonus ?? common.bonus,
        housing: override.housing_allowance ?? common.housing_allowance,
        food: override.food_allowance ?? common.food_allowance,
        marriage: override.marriage_allowance ?? common.marriage_allowance,
        child: override.child_allowance ?? common.child_allowance,
        otherBenefits: override.other_benefits ?? common.other_benefits,
        insurance: override.insurance ?? common.insurance,
        tax: override.tax ?? common.tax,
        otherDeductions: override.other_deductions ?? common.other_deductions,
      }, settingsRate);

      if (calc.base <= 0) {
        await client.query("ROLLBACK");
        return NextResponse.json({ success: false, error: `حقوق پایه برای ${employee.full_name} باید بیشتر از صفر باشد.` }, { status: 400 });
      }

      const inserted = await client.query(
        `INSERT INTO payslips
        (personnel_id,payroll_period_id,year,month,bank_account,job_group,job_title,base_salary,overtime,bonus,seniority_allowance,mission_allowance,work_days,mission_days,mission_hours,seniority_eligible,housing_allowance,food_allowance,marriage_allowance,child_allowance,other_benefits,insurance,tax,other_deductions,net_salary)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
        RETURNING id`,
        [employee.id, periodId, year, month, override.bank_account ?? common.bank_account ?? employee.bank_account ?? "", override.job_group ?? common.job_group ?? employee.job_group ?? "", override.job_title ?? common.job_title ?? employee.job_title ?? "", calc.base, num(override.overtime ?? common.overtime), num(override.bonus ?? common.bonus), calc.seniority, calc.mission, calc.days, calc.mDays, calc.mHours, Boolean(override.seniority_eligible ?? common.seniority_eligible), num(override.housing_allowance ?? common.housing_allowance), num(override.food_allowance ?? common.food_allowance), num(override.marriage_allowance ?? common.marriage_allowance), num(override.child_allowance ?? common.child_allowance), num(override.other_benefits ?? common.other_benefits), num(override.insurance ?? common.insurance), num(override.tax ?? common.tax), num(override.other_deductions ?? common.other_deductions), calc.netSalary]
      );

      created += 1;
      results.push({ employee_id: employee.id, personnel_code: employee.personnel_code, full_name: employee.full_name, status: "created", payslip_id: inserted.rows[0].id, net_salary: calc.netSalary, mission: calc.mission, seniority: calc.seniority });
    }

    await client.query("COMMIT");
    return NextResponse.json({ success: true, message: `صدور گروهی انجام شد: ${created} فیش صادر و ${skipped} فیش تکراری رد شد.`, summary: { total: employeeIds.length, created, skipped }, results }, { status: 201 });
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("POST bulk payslips error:", error);
    return NextResponse.json({ success: false, error: "خطا در صدور گروهی فیش‌ها؛ هیچ فیش ناقصی ثبت نشد." }, { status: 500 });
  } finally {
    client.release();
  }
}
