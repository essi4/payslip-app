import { NextResponse } from "next/server";
import pool from "../../lib/db.js";

export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT
        pp.id, pp.company_id, pp.year, pp.month, pp.status,
        pp.start_date, pp.end_date, pp.created_at, pp.updated_at,
        COUNT(p.id)::int AS payslip_count
      FROM payroll_periods pp
      LEFT JOIN payslips p ON p.payroll_period_id = pp.id
      GROUP BY pp.id
      ORDER BY pp.year DESC, pp.month DESC, pp.id DESC
    `);
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("GET /api/payroll-periods:", error);
    return NextResponse.json({ success: false, error: "خطا در دریافت دوره‌های حقوق" }, { status: 500 });
  }
}

export async function POST(request) {
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
    if (month < 1 || month > 12) {
      return NextResponse.json({ success: false, error: "ماه باید بین ۱ تا ۱۲ باشد" }, { status: 400 });
    }
    if (!["open", "closed"].includes(status)) {
      return NextResponse.json({ success: false, error: "وضعیت دوره نامعتبر است" }, { status: 400 });
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
  try {
    const body = await request.json();
    const id = Number(body.id);
    const status = body.status;

    if (!Number.isInteger(id)) {
      return NextResponse.json({ success: false, error: "شناسه دوره مشخص نشده است" }, { status: 400 });
    }
    if (!["open", "closed"].includes(status)) {
      return NextResponse.json({ success: false, error: "وضعیت دوره باید open یا closed باشد" }, { status: 400 });
    }

    const { rows } = await pool.query(
      `UPDATE payroll_periods SET status=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2 RETURNING *`,
      [status, id]
    );

    if (!rows.length) {
      return NextResponse.json({ success: false, error: "دوره موردنظر پیدا نشد" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("PATCH /api/payroll-periods:", error);
    return NextResponse.json({ success: false, error: "خطا در تغییر وضعیت دوره" }, { status: 500 });
  }
}
