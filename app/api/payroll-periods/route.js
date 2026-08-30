import { NextResponse } from "next/server";
import pool from "../../lib/db";
import { requireAdmin } from "../../lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const result = await pool.query(`
      SELECT
        p.year,
        p.month,
        COUNT(*)::int AS payslip_count,
        COALESCE(SUM(p.net_salary), 0) AS total_net_salary,
        MIN(p.created_at) AS first_created_at,
        MAX(p.created_at) AS last_created_at
      FROM payslips p
      GROUP BY p.year, p.month
      ORDER BY p.year DESC, p.month DESC
    `);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("GET PAYROLL PERIODS ERROR:", error);
    return NextResponse.json({ success: false, error: "خطا در دریافت دوره‌های حقوق." }, { status: 500 });
  }
}
