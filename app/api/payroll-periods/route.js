import { NextResponse } from "next/server";
import pool from "../../lib/db.js";
import { requireAdmin } from "../../lib/admin-auth.js";

export async function GET(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const rawCompanyId = searchParams.get("company_id");
    const companyId = rawCompanyId ? Number(rawCompanyId) : null;

    if (rawCompanyId && (!Number.isInteger(companyId) || companyId <= 0)) {
      return NextResponse.json({ success: false, error: "شناسه شرکت نامعتبر است" }, { status: 400 });
    }

    const { rows } = await pool.query(
      `
      SELECT
        pp.id, pp.company_id, pp.year, pp.month, pp.status,
        pp.start_date, pp.end_date, pp.created_at, pp.updated_at,
        COUNT(p.id)::int AS payslip_count
      FROM payroll_periods pp
      LEFT JOIN payslips p ON p.payroll_period_id = pp.id
      WHERE ($1::int IS NULL OR pp.company_id = $1)
      GROUP BY pp.id
      ORDER BY pp.year DESC, pp.month DESC, pp.id DESC
      `,
      [companyId]
    );
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("GET /api/payroll-periods:", error);
    return NextResponse.json({ success: false, error: "خطا در دریافت دوره‌های حقوق" }, { status: 500 });
  }
}

export async function POST(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  try {
    const body = await request.json();
    const companyId = Number(body.company_id);
    const year = Number(body.year);
    const month = Number(body.month);
    const status = body.status || "open";
    const startDate = body.start_date || null;
    const endDate = body.end_date || null;

    if (!Number.isInteger(companyId) || !Number.isInteger(year) || !Number.isInteger(month)) {
      return NextResponse.json({ success: false, error: "company_id، year و month الزامی هستند" }, { status: 400 });
    }
    if (companyId <= 0 || year < 1300 || year > 1600) {
      return NextResponse.json({ success: false, error: "اطلاعات شرکت یا سال نامعتبر است" }, { status: 400 });
    }
    if (month < 1 || month > 12) {
      return NextResponse.json({ success: false, error: "ماه باید بین ۱ تا ۱۲ باشد" }, { status: 400 });
    }
    if (!["open", "closed"].includes(status)) {
      return NextResponse.json({ success: false, error: "وضعیت دوره نامعتبر است" }, { status: 400 });
    }

    const company = await pool.query(`SELECT id FROM companies WHERE id=$1 LIMIT 1`, [companyId]);
    if (!company.rowCount) {
      return NextResponse.json({ success: false, error: "شرکت موردنظر پیدا نشد" }, { status: 404 });
    }

    if (startDate && endDate && String(startDate) > String(endDate)) {
      return NextResponse.json({ success: false, error: "تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد" }, { status: 400 });
    }

    const duplicate = await pool.query(
      `SELECT id FROM payroll_periods WHERE company_id=$1 AND year=$2 AND month=$3 LIMIT 1`,
      [companyId, year, month]
    );
    if (duplicate.rowCount > 0) {
      return NextResponse.json({ success: false, error: "این دوره برای این شرکت قبلاً ثبت شده است" }, { status: 409 });
    }

    const { rows } = await pool.query(
      `INSERT INTO payroll_periods (company_id, year, month, status, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [companyId, year, month, status, startDate, endDate]
    );
    return NextResponse.json({ success: true, data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/payroll-periods:", error);
    return NextResponse.json({ success: false, error: "خطا در ایجاد دوره حقوق" }, { status: 500 });
  }
}

export async function PATCH(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  try {
    const body = await request.json();
    const id = Number(body.id);
    const companyId = Number(body.company_id);
    const status = body.status;

    if (!Number.isInteger(id) || !Number.isInteger(companyId) || companyId <= 0) {
      return NextResponse.json({ success: false, error: "شناسه دوره و شرکت الزامی هستند" }, { status: 400 });
    }
    if (!["open", "closed"].includes(status)) {
      return NextResponse.json({ success: false, error: "وضعیت دوره باید open یا closed باشد" }, { status: 400 });
    }

    const { rows } = await pool.query(
      `UPDATE payroll_periods
       SET status=$1, updated_at=CURRENT_TIMESTAMP
       WHERE id=$2 AND company_id=$3
       RETURNING *`,
      [status, id, companyId]
    );

    if (!rows.length) {
      return NextResponse.json({ success: false, error: "دوره موردنظر برای این شرکت پیدا نشد" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("PATCH /api/payroll-periods:", error);
    return NextResponse.json({ success: false, error: "خطا در تغییر وضعیت دوره" }, { status: 500 });
  }
}
