import { NextResponse } from "next/server";
import pool from "../../lib/db";
import { hashPassword, verifyPassword } from "../../lib/password";
import { createEmployeeSession, getEmployeeSession } from "../../lib/employee-auth";
import { logSecurityEvent } from "../../lib/security-log";
import { checkRateLimit, clearRateLimit, getRequestIp } from "../../lib/rate-limit";

export const dynamic = "force-dynamic";

function cleanNationalId(value) {
  return String(value || "").replace(/[^0-9]/g, "");
}

function rateLimitedResponse(retryAfterSeconds) {
  return NextResponse.json(
    { success: false, error: "تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const session = getEmployeeSession(request);
    const month = body?.month ? String(body.month).trim() : "";
    const year = body?.year ? String(body.year).trim() : "";
    const requestIp = getRequestIp(request);

    let employeeResult;
    let response;

    if (session) {
      employeeResult = await pool.query(
        `SELECT id, full_name, national_id, personnel_code, department, job_title
         FROM personnel WHERE id = $1 LIMIT 1`,
        [session.employeeId]
      );
      if (!employeeResult.rows.length) {
        await logSecurityEvent({ employeeId: session.employeeId, event: "employee_session_invalid", request, success: false });
        return NextResponse.json({ success: false, error: "نشست کاربری معتبر نیست." }, { status: 401 });
      }
    } else {
      const nationalId = cleanNationalId(body?.national_id);
      const password = String(body?.password || "");
      const ipLimit = await checkRateLimit({ scope: "employee_login_ip", key: requestIp, maxAttempts: 20, windowMs: 15 * 60 * 1000, blockMs: 15 * 60 * 1000 });
      if (!ipLimit.allowed) {
        await logSecurityEvent({ event: "employee_login_rate_limit", request, success: false, details: { reason: "ip_limit" } });
        return rateLimitedResponse(ipLimit.retryAfterSeconds);
      }

      if (nationalId.length !== 10 || !password) {
        await logSecurityEvent({ event: "employee_login", request, success: false, details: { reason: "invalid_input" } });
        return NextResponse.json({ success: false, error: "کد ملی یا رمز عبور اشتباه است." }, { status: 401 });
      }

      employeeResult = await pool.query(
        `SELECT id, full_name, national_id, personnel_code, department, job_title, payslip_password
         FROM personnel WHERE national_id = $1 LIMIT 1`,
        [nationalId]
      );
      if (!employeeResult.rows.length) {
        await logSecurityEvent({ event: "employee_login", request, success: false, details: { reason: "invalid_credentials" } });
        return NextResponse.json({ success: false, error: "کد ملی یا رمز عبور اشتباه است." }, { status: 401 });
      }

      const employee = employeeResult.rows[0];
      const accountLimit = await checkRateLimit({ scope: "employee_login_account", key: nationalId, maxAttempts: 5, windowMs: 15 * 60 * 1000, blockMs: 15 * 60 * 1000 });
      if (!accountLimit.allowed) {
        await logSecurityEvent({ employeeId: employee.id, event: "employee_login_rate_limit", request, success: false, details: { reason: "account_limit" } });
        return rateLimitedResponse(accountLimit.retryAfterSeconds);
      }

      const check = await verifyPassword(password, employee.payslip_password);
      if (!check.valid) {
        await logSecurityEvent({ employeeId: employee.id, event: "employee_login", request, success: false, details: { reason: "invalid_credentials" } });
        return NextResponse.json({ success: false, error: "کد ملی یا رمز عبور اشتباه است." }, { status: 401 });
      }

      if (check.needsUpgrade) {
        await pool.query("UPDATE personnel SET payslip_password=$1 WHERE id=$2", [await hashPassword(password), employee.id]);
      }
      delete employee.payslip_password;
      await clearRateLimit({ scope: "employee_login_account", key: nationalId });
      await clearRateLimit({ scope: "employee_login_ip", key: requestIp });
      await logSecurityEvent({ employeeId: employee.id, event: "employee_login", request, success: true });

      response = NextResponse.json({ success: true, employee, months: [] });
      createEmployeeSession(response, employee.id);

      if (!month || !year) {
        const monthsResult = await pool.query(
          `SELECT id, year, month, net_salary, created_at FROM payslips WHERE personnel_id=$1 ORDER BY id DESC`,
          [employee.id]
        );
        response = NextResponse.json({ success: true, employee, months: monthsResult.rows });
        createEmployeeSession(response, employee.id);
        return response;
      }
    }

    const employee = employeeResult.rows[0];
    delete employee.payslip_password;

    if (!month || !year) {
      const monthsResult = await pool.query(
        `SELECT id, year, month, net_salary, created_at FROM payslips WHERE personnel_id=$1 ORDER BY id DESC`,
        [employee.id]
      );
      response = NextResponse.json({ success: true, employee, months: monthsResult.rows });
      if (!session) createEmployeeSession(response, employee.id);
      return response;
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

    response = NextResponse.json({ success: true, employee, data: payslipResult.rows });
    if (!session) createEmployeeSession(response, employee.id);
    return response;
  } catch (error) {
    console.error("PAYSLIP API ERROR:", error.message);
    return NextResponse.json({ success: false, error: "خطا در ارتباط با سامانه. لطفاً دوباره تلاش کنید." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: "روش درخواست نامعتبر است. ورود کارکنان باید با POST انجام شود." },
    { status: 405, headers: { Allow: "POST" } }
  );
}
