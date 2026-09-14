import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import { requireAdmin } from "../../../lib/admin-auth";
import { calculatePayroll1405, payrollControlFlags } from "../../../lib/payroll-1405";

export const dynamic = "force-dynamic";

const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

function monthNumber(value) {
  const numeric = Number(value);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 12) return numeric;
  const index = MONTHS.indexOf(String(value || "").trim());
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

export async function POST(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  let client;
  try {
    await ensureColumns();
    const body = await request.json();
    const companyId = Number(body.company_id);
    const year = Number(body.year || 1405);
    const month = String(body.month || "فروردین");
    const monthNo = monthNumber(month);
    const dryRun = body.dry_run === true;
    const rows = Array.isArray(body.rows) ? body.rows : [];

    if (!Number.isInteger(companyId) || companyId <= 0) return NextResponse.json({ success: false, error: "شرکت نامعتبر است." }, { status: 400 });
    if (year !== 1405) return NextResponse.json({ success: false, error: "این موتور صدور گروهی فعلاً مخصوص سال ۱۴۰۵ است." }, { status: 400 });
    if (!monthNo) return NextResponse.json({ success: false, error: "ماه نامعتبر است." }, { status: 400 });
    if (!rows.length) return NextResponse.json({ success: false, error: "حداقل یک کارمند برای صدور گروهی انتخاب کنید." }, { status: 400 });

    const company = await pool.query("SELECT id, name FROM companies WHERE id=$1 LIMIT 1", [companyId]);
    if (!company.rowCount) return NextResponse.json({ success: false, error: "شرکت پیدا نشد." }, { status: 404 });

    const periodResult = await pool.query("SELECT id, status FROM payroll_periods WHERE company_id=$1 AND year=$2 AND month=$3 LIMIT 1", [companyId, year, monthNo]);
    if (!periodResult.rowCount) return NextResponse.json({ success: false, error: "دوره حقوق این ماه برای شرکت ایجاد نشده است." }, { status: 409 });
    const period = periodResult.rows[0];
    if (period.status === "closed") return NextResponse.json({ success: false, error: "دوره حقوق بسته است و صدور گروهی مجاز نیست." }, { status: 409 });

    const employeeIds = rows.map((row) => Number(row.personnel_id)).filter((id) => Number.isInteger(id) && id > 0);
    if (!employeeIds.length) return NextResponse.json({ success: false, error: "هیچ شناسه پرسنلی معتبر ارسال نشده است." }, { status: 400 });

    const employeesResult = await pool.query(
      `SELECT id, full_name, personnel_code, bank_account, job_group, job_title, company_id
       FROM personnel WHERE company_id=$1 AND id = ANY($2::int[])`,
      [companyId, employeeIds]
    );
    const employees = new Map(employeesResult.rows.map((employee) => [Number(employee.id), employee]));

    const preview = [];
    const invalid = [];
    for (const row of rows) {
      const personnelId = Number(row.personnel_id);
      const employee = employees.get(personnelId);
      if (!employee) {
        invalid.push({ personnel_id: personnelId, error: "کارمند در شرکت انتخاب‌شده پیدا نشد." });
        continue;
      }
      const calc = calculatePayroll1405({ ...row, year, monthNumber: monthNo });
      const flags = payrollControlFlags(calc);
      preview.push({
        personnel_id: personnelId,
        full_name: employee.full_name,
        personnel_code: employee.personnel_code,
        calculation: calc,
        flags,
        hasError: flags.some((flag) => flag.level === "error"),
      });
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dry_run: true,
        company: company.rows[0],
        period,
        summary: {
          requested: rows.length,
          valid: preview.length,
          invalid: invalid.length,
          errors: preview.filter((item) => item.hasError).length,
          warnings: preview.reduce((sum, item) => sum + item.flags.filter((flag) => flag.level === "warning").length, 0),
          gross: preview.reduce((sum, item) => sum + item.calculation.grossSalary, 0),
          insurance: preview.reduce((sum, item) => sum + item.calculation.insurance, 0),
          tax: preview.reduce((sum, item) => sum + item.calculation.tax, 0),
          net: preview.reduce((sum, item) => sum + item.calculation.netSalary, 0),
        },
        preview,
        invalid,
      });
    }

    if (invalid.length || preview.some((item) => item.hasError)) {
      return NextResponse.json({ success: false, error: "صدور گروهی متوقف شد؛ ابتدا خطاهای کنترل نهایی را برطرف کنید.", preview, invalid }, { status: 422 });
    }

    client = await pool.connect();
    await client.query("BEGIN");
    const created = [];
    const skipped = [];

    for (const item of preview) {
      const row = rows.find((candidate) => Number(candidate.personnel_id) === item.personnel_id);
      const duplicate = await client.query("SELECT id FROM payslips WHERE personnel_id=$1 AND payroll_period_id=$2 LIMIT 1", [item.personnel_id, period.id]);
      if (duplicate.rowCount) {
        skipped.push({ personnel_id: item.personnel_id, full_name: item.full_name, payslip_id: duplicate.rows[0].id, reason: "برای این دوره فیش قبلاً صادر شده است." });
        continue;
      }

      const c = item.calculation;
      const result = await client.query(
        `INSERT INTO payslips
        (personnel_id,payroll_period_id,year,month,bank_account,job_group,job_title,base_salary,overtime,bonus,seniority_allowance,mission_allowance,work_days,mission_days,mission_hours,seniority_eligible,housing_allowance,food_allowance,marriage_allowance,child_allowance,other_benefits,insurance,tax,other_deductions,net_salary)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25) RETURNING id, personnel_id, net_salary`,
        [item.personnel_id, period.id, year, month, row.bank_account ?? "", row.job_group ?? "", row.job_title ?? "", c.baseSalary, c.overtime, c.bonus, c.seniorityAllowance, c.missionAllowance, c.workDays, c.missionDays, c.missionHours, c.seniorityEligible, c.housingAllowance, c.foodAllowance, c.marriageAllowance, c.childAllowance, c.otherBenefits, c.insurance, c.tax, c.otherDeductions, c.netSalary]
      );
      created.push({ ...result.rows[0], full_name: item.full_name, personnel_code: item.personnel_code });
    }

    await client.query("COMMIT");
    return NextResponse.json({ success: true, message: `صدور گروهی انجام شد؛ ${created.length} فیش صادر و ${skipped.length} فیش قبلی رد شد.`, period, created, skipped, summary: { created: created.length, skipped: skipped.length, requested: rows.length } }, { status: 201 });
  } catch (error) {
    if (client) { try { await client.query("ROLLBACK"); } catch {} }
    console.error("POST /api/payslips/batch:", error);
    return NextResponse.json({ success: false, error: "صدور گروهی فیش‌ها انجام نشد." }, { status: 500 });
  } finally {
    client?.release();
  }
}
