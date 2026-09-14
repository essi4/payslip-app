import { NextResponse } from "next/server";
import pool from "../../lib/db";
import { requireAdmin } from "../../lib/admin-auth";

export const dynamic = "force-dynamic";

const GROUPS = Array.from({ length: 20 }, (_, index) => index + 1);
const KNOWN_DAILY_RATES_1405 = { 6: 6292029 };

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wage_groups (
      id SERIAL PRIMARY KEY,
      group_number INTEGER NOT NULL UNIQUE CHECK (group_number BETWEEN 1 AND 20),
      year INTEGER NOT NULL DEFAULT 1405,
      daily_base_salary NUMERIC NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  for (const groupNumber of GROUPS) {
    const knownRate = KNOWN_DAILY_RATES_1405[groupNumber] || 0;
    await pool.query(
      `INSERT INTO wage_groups (group_number, year, daily_base_salary)
       VALUES ($1, 1405, $2)
       ON CONFLICT (group_number) DO NOTHING`,
      [groupNumber, knownRate]
    );
  }
}

export async function GET(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    await ensureTable();
    const result = await pool.query(
      `SELECT id, group_number, year, daily_base_salary
       FROM wage_groups
       WHERE year=1405
       ORDER BY group_number`
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Wage groups GET error:", error);
    return NextResponse.json({ success: false, error: "خطا در دریافت گروه‌های مزدی" }, { status: 500 });
  }
}

export async function PUT(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    await ensureTable();
    const body = await request.json();
    const groupNumber = Number(body.group_number);
    const dailyBaseSalary = Number(body.daily_base_salary);

    if (!Number.isInteger(groupNumber) || groupNumber < 1 || groupNumber > 20) {
      return NextResponse.json({ success: false, error: "گروه مزدی باید بین ۱ تا ۲۰ باشد." }, { status: 400 });
    }
    if (!Number.isFinite(dailyBaseSalary) || dailyBaseSalary < 0) {
      return NextResponse.json({ success: false, error: "مبلغ پایه روزانه نامعتبر است." }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE wage_groups
       SET daily_base_salary=$1, updated_at=NOW()
       WHERE group_number=$2 AND year=1405
       RETURNING id, group_number, year, daily_base_salary`,
      [dailyBaseSalary, groupNumber]
    );

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Wage groups PUT error:", error);
    return NextResponse.json({ success: false, error: "خطا در ذخیره مبلغ گروه مزدی" }, { status: 500 });
  }
}
