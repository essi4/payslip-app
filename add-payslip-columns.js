import pool from "./app/lib/db.js";

async function addColumns() {
  try {
    await pool.query(`
      ALTER TABLE payslips
      ADD COLUMN IF NOT EXISTS bank_account VARCHAR(100),
      ADD COLUMN IF NOT EXISTS job_group VARCHAR(100),
      ADD COLUMN IF NOT EXISTS job_title VARCHAR(150),

      ADD COLUMN IF NOT EXISTS housing_allowance NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS food_allowance NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS marriage_allowance NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS child_allowance NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS other_benefits NUMERIC DEFAULT 0,

      ADD COLUMN IF NOT EXISTS other_deductions NUMERIC DEFAULT 0;
    `);

    console.log("ستون‌های جدید با موفقیت اضافه شدند.");
  } catch (error) {
    console.error("خطا:", error);
  } finally {
    await pool.end();
  }
}

addColumns();