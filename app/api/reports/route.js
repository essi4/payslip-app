import { NextResponse } from "next/server";
import pool from "../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const year = searchParams.get("year") || "";
    const month = searchParams.get("month") || "";
    const personnelId = searchParams.get("personnel_id") || "";

    const conditions = [];
    const values = [];

    if (year) {
      values.push(year);
      conditions.push(`p.year = $${values.length}`);
    }

    if (month) {
      values.push(month);
      conditions.push(`p.month = $${values.length}`);
    }

    if (personnelId) {
      values.push(Number(personnelId));
      conditions.push(`p.personnel_id = $${values.length}`);
    }

    const where = conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const summaryResult = await pool.query(
      `
      SELECT
        COUNT(*)::int AS payslips_count,
        COALESCE(SUM(p.base_salary), 0) AS total_base_salary,
        COALESCE(
          SUM(
            COALESCE(p.overtime, 0) +
            COALESCE(p.bonus, 0) +
            COALESCE(p.housing_allowance, 0) +
            COALESCE(p.food_allowance, 0) +
            COALESCE(p.marriage_allowance, 0) +
            COALESCE(p.child_allowance, 0) +
            COALESCE(p.other_benefits, 0)
          ),
          0
        ) AS total_benefits,
        COALESCE(
          SUM(
            COALESCE(p.insurance, 0) +
            COALESCE(p.tax, 0) +
            COALESCE(p.other_deductions, 0)
          ),
          0
        ) AS total_deductions,
        COALESCE(SUM(p.net_salary), 0) AS total_net_salary
      FROM payslips p
      ${where}
      `,
      values
    );

    const employeesResult = await pool.query(
      `
      SELECT COUNT(DISTINCT p.personnel_id)::int AS employees_count
      FROM payslips p
      ${where}
      `,
      values
    );

    const monthlyResult = await pool.query(
      `
      SELECT
        p.year,
        p.month,
        COUNT(*)::int AS payslips_count,
        COALESCE(SUM(p.base_salary), 0) AS base_salary,
        COALESCE(
          SUM(
            COALESCE(p.overtime, 0) +
            COALESCE(p.bonus, 0) +
            COALESCE(p.housing_allowance, 0) +
            COALESCE(p.food_allowance, 0) +
            COALESCE(p.marriage_allowance, 0) +
            COALESCE(p.child_allowance, 0) +
            COALESCE(p.other_benefits, 0)
          ),
          0
        ) AS benefits,
        COALESCE(
          SUM(
            COALESCE(p.insurance, 0) +
            COALESCE(p.tax, 0) +
            COALESCE(p.other_deductions, 0)
          ),
          0
        ) AS deductions,
        COALESCE(SUM(p.net_salary), 0) AS net_salary
      FROM payslips p
      ${where}
      GROUP BY p.year, p.month
      ORDER BY p.year DESC, MIN(p.id) DESC
      `,
      values
    );

    const payslipsResult = await pool.query(
      `
      SELECT
        p.id,
        p.year,
        p.month,
        p.base_salary,
        COALESCE(p.overtime, 0) +
        COALESCE(p.bonus, 0) +
        COALESCE(p.housing_allowance, 0) +
        COALESCE(p.food_allowance, 0) +
        COALESCE(p.marriage_allowance, 0) +
        COALESCE(p.child_allowance, 0) +
        COALESCE(p.other_benefits, 0) AS benefits,
        COALESCE(p.insurance, 0) +
        COALESCE(p.tax, 0) +
        COALESCE(p.other_deductions, 0) AS deductions,
        p.net_salary,
        p.created_at,
        e.full_name,
        e.personnel_code
      FROM payslips p
      LEFT JOIN personnel e ON p.personnel_id = e.id
      ${where}
      ORDER BY p.id DESC
      `,
      values
    );

    const summary = summaryResult.rows[0];

    return NextResponse.json({
      success: true,
      filters: {
        year,
        month,
        personnel_id: personnelId,
      },
      data: {
        employeesCount: Number(employeesResult.rows[0]?.employees_count || 0),
        payslipsCount: Number(summary?.payslips_count || 0),
        totalBaseSalary: Number(summary?.total_base_salary || 0),
        totalBenefits: Number(summary?.total_benefits || 0),
        totalDeductions: Number(summary?.total_deductions || 0),
        totalNetSalary: Number(summary?.total_net_salary || 0),
        monthlyReports: monthlyResult.rows.map((item) => ({
          year: item.year,
          month: item.month,
          payslipsCount: Number(item.payslips_count || 0),
          baseSalary: Number(item.base_salary || 0),
          benefits: Number(item.benefits || 0),
          deductions: Number(item.deductions || 0),
          netSalary: Number(item.net_salary || 0),
        })),
        payslips: payslipsResult.rows.map((item) => ({
          id: item.id,
          year: item.year,
          month: item.month,
          base_salary: Number(item.base_salary || 0),
          benefits: Number(item.benefits || 0),
          deductions: Number(item.deductions || 0),
          net_salary: Number(item.net_salary || 0),
          created_at: item.created_at,
          full_name: item.full_name,
          personnel_code: item.personnel_code,
        })),
      },
    });
  } catch (error) {
    console.error("GET reports error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "خطا در دریافت گزارش‌ها",
      },
      { status: 500 }
    );
  }
}
