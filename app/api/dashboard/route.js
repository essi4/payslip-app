import { NextResponse } from "next/server";
import pool from "../../lib/db";

export async function GET() {
  try {
    const employeesResult = await pool.query(
      "SELECT COUNT(*)::int AS count FROM personnel"
    );

    const payslipsResult = await pool.query(
      "SELECT COUNT(*)::int AS count FROM payslips"
    );

    const salaryResult = await pool.query(
      "SELECT COALESCE(SUM(base_salary), 0) AS total_base_salary, COALESCE(SUM(net_salary), 0) AS total_net_salary FROM payslips"
    );

    const recentResult = await pool.query(
      "SELECT p.id, p.personnel_id, p.year, p.month, p.base_salary, p.net_salary, p.created_at, COALESCE(pe.full_name, '—') AS full_name, COALESCE(pe.personnel_code, '—') AS personnel_code FROM payslips p LEFT JOIN personnel pe ON pe.id = p.personnel_id ORDER BY p.id DESC LIMIT 5"
    );

    const employeesCount = Number(
      employeesResult.rows[0]?.count || 0
    );

    const payslipsCount = Number(
      payslipsResult.rows[0]?.count || 0
    );

    const totalBaseSalary = Number(
      salaryResult.rows[0]?.total_base_salary || 0
    );

    const totalNetSalary = Number(
      salaryResult.rows[0]?.total_net_salary || 0
    );

    return NextResponse.json({
      success: true,
      data: {
        employeesCount,
        payslipsCount,
        totalBaseSalary,
        totalBenefits: 0,
        totalDeductions: 0,
        totalNetSalary,
        recentPayslips: recentResult.rows
      }
    });
  } catch (error) {
    console.error("DASHBOARD ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "خطا در دریافت داشبورد"
      },
      {
        status: 500
      }
    );
  }
}