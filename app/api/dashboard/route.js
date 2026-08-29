import { NextResponse } from "next/server";
import pool from "../../lib/db";
import { requireAdmin } from "../../lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const employeesResult = await pool.query("SELECT COUNT(*)::int AS count FROM personnel");
    const payslipsResult = await pool.query("SELECT COUNT(*)::int AS count FROM payslips");
    const salaryResult = await pool.query(`
      SELECT
        COALESCE(SUM(base_salary), 0) AS total_base_salary,
        COALESCE(SUM(overtime + bonus + housing_allowance + food_allowance + marriage_allowance + child_allowance + other_benefits), 0) AS total_benefits,
        COALESCE(SUM(insurance + tax + other_deductions), 0) AS total_deductions,
        COALESCE(SUM(net_salary), 0) AS total_net_salary
      FROM payslips
    `);
    const recentResult = await pool.query(`
      SELECT p.id, p.personnel_id, p.year, p.month, p.base_salary, p.net_salary, p.created_at,
        COALESCE(pe.full_name, '—') AS full_name,
        COALESCE(pe.personnel_code, '—') AS personnel_code,
        COALESCE(c.name, '—') AS company_name
      FROM payslips p
      LEFT JOIN personnel pe ON pe.id = p.personnel_id
      LEFT JOIN companies c ON c.id = pe.company_id
      ORDER BY p.id DESC LIMIT 5
    `);

    const salary = salaryResult.rows[0] || {};

    return NextResponse.json({
      success: true,
      data: {
        employeesCount: Number(employeesResult.rows[0]?.count || 0),
        payslipsCount: Number(payslipsResult.rows[0]?.count || 0),
        totalBaseSalary: Number(salary.total_base_salary || 0),
        totalBenefits: Number(salary.total_benefits || 0),
        totalDeductions: Number(salary.total_deductions || 0),
        totalNetSalary: Number(salary.total_net_salary || 0),
        recentPayslips: recentResult.rows,
      },
    });
  } catch (error) {
    console.error("DASHBOARD ERROR:", error);
    return NextResponse.json({ success: false, error: error?.message || "خطا در دریافت داشبورد" }, { status: 500 });
  }
}