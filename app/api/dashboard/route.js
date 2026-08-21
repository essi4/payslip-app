import { NextResponse } from "next/server";
import pool from "../../lib/db";

export async function GET() {
  try {
    // ==============================
    // تعداد کارکنان
    // ==============================

    const employeesResult = await pool.query(`
      SELECT COUNT(*)::int AS count
      FROM personnel
    `);

    // ==============================
    // تعداد فیش‌ها
    // ==============================

    const payslipsResult = await pool.query(`
      SELECT COUNT(*)::int AS count
      FROM payslips
    `);

    // ==============================
    // مجموع حقوق پایه
    // ==============================

    const baseSalaryResult = await pool.query(`
      SELECT COALESCE(SUM(base_salary), 0) AS total
      FROM payslips
    `);

    // ==============================
    // مجموع مزایا
    // ==============================

    const benefitsResult = await pool.query(`
      SELECT COALESCE(
        SUM(
          COALESCE(overtime, 0) +
          COALESCE(bonus, 0) +
          COALESCE(housing_allowance, 0) +
          COALESCE(food_allowance, 0) +
          COALESCE(marriage_allowance, 0) +
          COALESCE(child_allowance, 0) +
          COALESCE(other_benefits, 0)
        ),
        0
      ) AS total
      FROM payslips
    `);

    // ==============================
    // مجموع کسورات
    // ==============================

    const deductionsResult = await pool.query(`
      SELECT COALESCE(
        SUM(
          COALESCE(insurance, 0) +
          COALESCE(tax, 0) +
          COALESCE(other_deductions, 0)
        ),
        0
      ) AS total
      FROM payslips
    `);

    // ==============================
    // مجموع خالص پرداختی
    // ==============================

    const netSalaryResult = await pool.query(`
      SELECT COALESCE(SUM(net_salary), 0) AS total
      FROM payslips
    `);

    // ==============================
    // آخرین فیش‌ها
    // ==============================

    const recentPayslipsResult = await pool.query(`
      SELECT
        p.id,
        p.year,
        p.month,
        p.base_salary,
        p.net_salary,
        p.created_at,
        e.full_name,
        e.personnel_code
      FROM payslips p
      LEFT JOIN personnel e
        ON p.personnel_id = e.id
      ORDER BY p.id DESC
      LIMIT 5
    `);

    // ==============================
    // پاسخ نهایی
    // ==============================

    return NextResponse.json({
      success: true,

      data: {
        employeesCount:
          employeesResult.rows[0].count,

        payslipsCount:
          payslipsResult.rows[0].count,

        totalBaseSalary:
          Number(baseSalaryResult.rows[0].total || 0),

        totalBenefits:
          Number(benefitsResult.rows[0].total || 0),

        totalDeductions:
          Number(deductionsResult.rows[0].total || 0),

        totalNetSalary:
          Number(netSalaryResult.rows[0].total || 0),

        recentPayslips:
          recentPayslipsResult.rows,
      },
    });

  } catch (error) {

    console.error(
      "GET dashboard error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "خطا در دریافت اطلاعات داشبورد",
      },
      {
        status: 500,
      }
    );
  }
}