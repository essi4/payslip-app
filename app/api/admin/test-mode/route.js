import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import { requireAdmin } from "../../../lib/admin-auth";

export const dynamic = "force-dynamic";

const TEST_MODE_ENABLED = () => process.env.PAYROLL_TEST_MODE === "true";

function jsonError(error, status = 500) {
  return NextResponse.json({ success: false, error }, { status });
}

async function callInternal(request, pathname, body) {
  const origin = new URL(request.url).origin;
  const cookie = request.headers.get("cookie") || "";
  const response = await fetch(`${origin}${pathname}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({ success: false, error: "پاسخ نامعتبر از سرویس داخلی" }));
  return { status: response.status, payload };
}

async function createTestFixture() {
  const client = await pool.connect();
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const suffix = String(Date.now()).slice(-8);

  try {
    await client.query("BEGIN");

    const company = await client.query(
      `INSERT INTO companies (name) VALUES ($1) RETURNING id, name`,
      [`__PAYROLL_TEST__ ${runId}`]
    );
    const companyId = company.rows[0].id;

    const employeeRows = [];
    for (const [index, prefix] of [[1, "99"], [2, "98"]]) {
      const nationalId = `${prefix}${suffix}`;
      const employee = await client.query(
        `INSERT INTO personnel
          (company_id, full_name, national_id, personnel_code, department, job_title, bank_account, job_group, payslip_password)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING id, full_name, personnel_code`,
        [
          companyId,
          `کارمند تستی ${index}`,
          nationalId,
          `TEST-${suffix}-${index}`,
          "TEST MODE",
          "کارمند آزمایشی",
          null,
          "TEST",
          null,
        ]
      );
      employeeRows.push(employee.rows[0]);
    }

    const period = await client.query(
      `INSERT INTO payroll_periods (company_id, year, month, status, start_date, end_date)
       VALUES ($1,$2,$3,'open',NULL,NULL)
       RETURNING id, company_id, year, month, status`,
      [companyId, 1405, 12]
    );

    await client.query("COMMIT");

    return {
      runId,
      company: company.rows[0],
      employees: employeeRows,
      period: period.rows[0],
    };
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    throw error;
  } finally {
    client.release();
  }
}

async function cleanupFixture(fixture) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const employeeIds = fixture.employees.map((employee) => Number(employee.id));
    await client.query(
      `DELETE FROM payslips WHERE payroll_period_id=$1 AND personnel_id = ANY($2::int[])`,
      [fixture.period.id, employeeIds]
    );
    await client.query(
      `DELETE FROM payroll_periods WHERE id=$1 AND company_id=$2`,
      [fixture.period.id, fixture.company.id]
    );
    await client.query(
      `DELETE FROM personnel WHERE company_id=$1 AND id = ANY($2::int[])`,
      [fixture.company.id, employeeIds]
    );
    await client.query(
      `DELETE FROM companies WHERE id=$1`,
      [fixture.company.id]
    );

    await client.query("COMMIT");

    const [companyCheck, periodCheck, employeeCheck, payslipCheck] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM companies WHERE id=$1", [fixture.company.id]),
      pool.query("SELECT COUNT(*)::int AS count FROM payroll_periods WHERE id=$1", [fixture.period.id]),
      pool.query("SELECT COUNT(*)::int AS count FROM personnel WHERE id = ANY($1::int[])", [employeeIds]),
      pool.query("SELECT COUNT(*)::int AS count FROM payslips WHERE id = ANY($1::int[])", [fixture.payslipIds || [-1]]),
    ]);

    const remaining = {
      companies: companyCheck.rows[0].count,
      payrollPeriods: periodCheck.rows[0].count,
      employees: employeeCheck.rows[0].count,
      payslips: payslipCheck.rows[0].count,
    };

    if (Object.values(remaining).some((count) => Number(count) !== 0)) {
      throw new Error(`پاک‌سازی کامل نبود: ${JSON.stringify(remaining)}`);
    }

    return remaining;
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    throw error;
  } finally {
    client.release();
  }
}

export async function GET(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  return NextResponse.json({
    success: true,
    enabled: TEST_MODE_ENABLED(),
    message: TEST_MODE_ENABLED()
      ? "حالت تست فعال است."
      : "حالت تست غیرفعال است. برای اجرای آن PAYROLL_TEST_MODE=true تنظیم شود.",
  });
}

export async function POST(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  if (!TEST_MODE_ENABLED()) {
    return jsonError("حالت TEST MODE در محیط فعلی فعال نیست.", 403);
  }

  let fixture = null;
  const steps = [];

  try {
    fixture = await createTestFixture();
    steps.push({ step: "setup", status: "passed", detail: `شرکت تستی + ${fixture.employees.length} کارمند + ۱ دوره ساخته شد.` });

    const bulk = await callInternal(request, "/api/payslips/bulk", {
      company_id: fixture.company.id,
      payroll_period_id: fixture.period.id,
      year: fixture.period.year,
      month: fixture.period.month,
      employee_ids: fixture.employees.map((employee) => employee.id),
      defaults: {
        base_salary: 300000000,
        work_days: 30,
        mission_days: 2,
        mission_hours: 3,
        seniority_eligible: true,
        overtime: 0,
        bonus: 0,
        housing_allowance: 0,
        food_allowance: 0,
        marriage_allowance: 0,
        child_allowance: 0,
        other_benefits: 0,
        insurance: 0,
        tax: 0,
        other_deductions: 0,
      },
    });

    if (bulk.status !== 201 || !bulk.payload?.success || Number(bulk.payload?.summary?.created) !== 2) {
      throw new Error(`صدور گروهی تستی شکست خورد: ${bulk.payload?.error || `HTTP ${bulk.status}`}`);
    }

    fixture.payslipIds = (bulk.payload.results || [])
      .filter((item) => item.status === "created")
      .map((item) => Number(item.payslip_id))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (fixture.payslipIds.length !== 2) {
      throw new Error("تعداد فیش‌های ساخته‌شده تستی ۲ نیست.");
    }

    steps.push({ step: "bulk_issue", status: "passed", detail: "۲ فیش تستی با موفقیت صادر شد." });

    const duplicateBulk = await callInternal(request, "/api/payslips/bulk", {
      company_id: fixture.company.id,
      payroll_period_id: fixture.period.id,
      year: fixture.period.year,
      month: fixture.period.month,
      employee_ids: fixture.employees.map((employee) => employee.id),
      defaults: { base_salary: 300000000, work_days: 30, mission_days: 0, mission_hours: 0, seniority_eligible: false },
    });

    if (duplicateBulk.status !== 201 || Number(duplicateBulk.payload?.summary?.created) !== 0 || Number(duplicateBulk.payload?.summary?.skipped) !== 2) {
      throw new Error(`کنترل فیش تکراری شکست خورد: ${duplicateBulk.payload?.error || `HTTP ${duplicateBulk.status}`}`);
    }

    steps.push({ step: "duplicate_guard", status: "passed", detail: "صدور مجدد کنترل شد: ۰ فیش جدید و ۲ فیش تکراری رد شد." });

    const print = await callInternal(request, "/api/payslips/print", {
      company_id: fixture.company.id,
      payroll_period_id: fixture.period.id,
      payslip_ids: fixture.payslipIds,
    });

    if (print.status !== 200 || !print.payload?.success || Number(print.payload?.meta?.count) !== 2) {
      throw new Error(`اعتبارسنجی نهایی چاپ شکست خورد: ${print.payload?.error || `HTTP ${print.status}`}`);
    }

    steps.push({ step: "final_print_validation", status: "passed", detail: "کنترل نهایی چاپ ۲ فیش با همان شرکت و دوره تأیید شد." });

    const remaining = await cleanupFixture(fixture);
    steps.push({ step: "cleanup", status: "passed", detail: "همه رکوردهای تستی حذف شدند و شمارنده باقی‌مانده‌ها صفر است.", remaining });

    return NextResponse.json({
      success: true,
      mode: "TEST MODE",
      message: "تست کامل با موفقیت اجرا و پاک‌سازی شد.",
      steps,
    });
  } catch (error) {
    console.error("TEST MODE ERROR:", error);

    if (fixture) {
      try {
        const remaining = await cleanupFixture(fixture);
        steps.push({ step: "cleanup", status: "passed", detail: "پس از خطا نیز رکوردهای تستی پاک شدند.", remaining });
      } catch (cleanupError) {
        console.error("TEST MODE CLEANUP ERROR:", cleanupError);
        steps.push({ step: "cleanup", status: "failed", detail: cleanupError?.message || "پاک‌سازی تستی کامل نشد." });
      }
    }

    return NextResponse.json({
      success: false,
      mode: "TEST MODE",
      message: error?.message || "اجرای تست با خطا متوقف شد.",
      steps,
    }, { status: 500 });
  }
}
