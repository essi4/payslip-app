import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import { requireAdmin } from "../../../lib/admin-auth";
import { calculatePayroll1405 } from "../../../lib/payroll-1405";

export const dynamic = "force-dynamic";

const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

function number(value) {
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
      ADD COLUMN IF NOT EXISTS past_seniority_allowance NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS mission_allowance NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS work_days NUMERIC DEFAULT 30,
      ADD COLUMN IF NOT EXISTS mission_days NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS mission_hours NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS seniority_eligible BOOLEAN DEFAULT false
  `);
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
    const employeeIds = Array.isArray(body.employee_ids)
      ? [...new Set(body.employee_ids.map(Number).filter((id) => Number.isInteger(id) && id > 0))]
      : [];

    if (!Number.isInteger(companyId) || companyId <= 0) {
      return NextResponse.json({ success: false, error: "شرکت انتخاب نشده است." }, { status: 400 });
    }
    if (!Number.isInteger(periodId) || periodId <= 0) {
      return NextResponse.json({ success: false, error: "دوره حقوق انتخاب نشده است." }, { status: 400 });
    }
    if (!employeeIds.length) {
      return NextResponse.json({ success: false, error: "حداقل یک کارمند را انتخاب کنید." }, { status: 400 });
    }

    await client.query("BEGIN");

    const periodResult = await client.query(
      `SELECT id, company_id, year, month, status
       FROM payroll_periods
       WHERE id=$1
       FOR UPDATE`,
      [periodId],
    );
    const period = periodResult.rows[0];

    if (!period || Number(period.company_id) !== companyId) {
      await client.query("ROLLBACK");
      return NextResponse.json({ success: false, error: "دوره حقوق انتخاب‌شده متعلق به شرکت نیست." }, { status: 409 });
    }

    if (period.status === "closed") {
      await client.query("ROLLBACK");
      return NextResponse.json({ success: false, error: "این دوره حقوق بسته است و صدور فیش جدید مجاز نیست." }, { status: 409 });
    }

    const employeesResult = await client.query(
      `SELECT id, full_name, personnel_code, company_id, bank_account, job_group, job_title,
              marital_status, children_count
       FROM personnel
       WHERE company_id=$1 AND id = ANY($2::int[])
       ORDER BY id`,
      [companyId, employeeIds],
    );
    const employees = employeesResult.rows;

    if (employees.length !== employeeIds.length) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { success: false, error: "یک یا چند کارمند متعلق به شرکت انتخاب‌شده نیستند یا پیدا نشدند." },
        { status: 409 },
      );
    }

    const common = body.defaults && typeof body.defaults === "object" ? body.defaults : {};
    const overrides = body.overrides && typeof body.overrides === "object" ? body.overrides : {};
    const results = [];
    let created = 0;
    let skipped = 0;

    for (const employee of employees) {
      const existing = await client.query(
        `SELECT id FROM payslips
         WHERE personnel_id=$1 AND payroll_period_id=$2
         LIMIT 1`,
        [employee.id, periodId],
      );

      if (existing.rowCount) {
        skipped += 1;
        results.push({
          employee_id: employee.id,
          personnel_code: employee.personnel_code,
          full_name: employee.full_name,
          status: "skipped",
          reason: "برای این کارمند در این دوره فیش قبلاً صادر شده است.",
          payslip_id: existing.rows[0].id,
        });
        continue;
      }

      const groupNumber = Number(employee.job_group);
      if (!Number.isInteger(groupNumber) || groupNumber < 1 || groupNumber > 20) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { success: false, error: `گروه مزدی ${employee.full_name} معتبر نیست؛ ابتدا گروه ۱ تا ۲۰ را ثبت کنید.` },
          { status: 400 },
        );
      }

      const override = overrides[String(employee.id)] && typeof overrides[String(employee.id)] === "object"
        ? overrides[String(employee.id)]
        : {};

      const calculation = calculatePayroll1405({
        year: Number(period.year),
        monthNumber: Number(period.month),
        job_group: groupNumber,
        work_days: override.work_days ?? common.work_days,
        mission_days: override.mission_days ?? common.mission_days,
        mission_hours: override.mission_hours ?? common.mission_hours,
        seniority_eligible: override.seniority_eligible ?? common.seniority_eligible,
        overtime: override.overtime ?? common.overtime_hours ?? common.overtime,
        overtime_hours: override.overtime_hours ?? common.overtime_hours,
        bonus: override.bonus ?? common.bonus,
        housing_allowance: override.housing_allowance ?? common.housing_allowance,
        food_allowance: override.food_allowance ?? common.food_allowance,
        marriage_allowance: override.marriage_allowance ?? common.marriage_allowance,
        child_allowance: override.child_allowance ?? common.child_allowance,
        child_count: Number(employee.children_count || 0),
        married: employee.marital_status === "married" || employee.marital_status === "متأهل",
        other_benefits: override.other_benefits ?? common.other_benefits,
        other_deductions: override.other_deductions ?? common.other_deductions,
        insurance: override.insurance ?? common.insurance,
        tax: override.tax ?? common.tax,
      });

      if (calculation.baseSalary <= 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { success: false, error: `حقوق پایه برای ${employee.full_name} معتبر نیست.` },
          { status: 400 },
        );
      }

      const inserted = await client.query(
        `INSERT INTO payslips
          (personnel_id,payroll_period_id,year,month,bank_account,job_group,job_title,
           base_salary,overtime,bonus,seniority_allowance,past_seniority_allowance,
           mission_allowance,work_days,mission_days,mission_hours,seniority_eligible,
           housing_allowance,food_allowance,marriage_allowance,child_allowance,other_benefits,
           insurance,tax,other_deductions,net_salary)
         VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
         RETURNING id`,
        [
          employee.id,
          periodId,
          Number(period.year),
          Number(period.month),
          override.bank_account ?? common.bank_account ?? employee.bank_account ?? "",
          String(groupNumber),
          override.job_title ?? common.job_title ?? employee.job_title ?? "",
          calculation.baseSalary,
          calculation.overtime,
          calculation.bonus,
          calculation.seniorityAllowance,
          calculation.pastSeniorityAllowance,
          calculation.missionAllowance,
          calculation.workDays,
          calculation.missionDays,
          calculation.missionHours,
          calculation.seniorityEligible,
          calculation.housingAllowance,
          calculation.foodAllowance,
          calculation.marriageAllowance,
          calculation.childAllowance,
          calculation.otherBenefits,
          calculation.insurance,
          calculation.tax,
          calculation.otherDeductions,
          calculation.netSalary,
        ],
      );

      created += 1;
      results.push({
        employee_id: employee.id,
        personnel_code: employee.personnel_code,
        full_name: employee.full_name,
        status: "created",
        payslip_id: inserted.rows[0].id,
        wage_group: groupNumber,
        daily_base_salary: calculation.groupDailyWage,
        base_salary: calculation.baseSalary,
        past_seniority_allowance: calculation.pastSeniorityAllowance,
        seniority_allowance: calculation.seniorityAllowance,
        insurance: calculation.insurance,
        tax: calculation.tax,
        net_salary: calculation.netSalary,
      });
    }

    await client.query("COMMIT");

    return NextResponse.json(
      {
        success: true,
        message: `صدور گروهی انجام شد: ${created} فیش صادر و ${skipped} فیش تکراری رد شد.`,
        summary: { total: employeeIds.length, created, skipped },
        results,
      },
      { status: 201 },
    );
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("POST bulk payslips error:", error);
    return NextResponse.json(
      { success: false, error: "خطا در صدور گروهی فیش‌ها؛ هیچ فیش ناقصی ثبت نشد." },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
