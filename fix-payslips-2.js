import pool from "./app/lib/db.js";

async function updatePayslipsTable() {
  try {
    console.log("Connecting to database...");

    await pool.query(`
      ALTER TABLE payslips
      ADD COLUMN IF NOT EXISTS bank_account VARCHAR(50);

      ALTER TABLE payslips
      ADD COLUMN IF NOT EXISTS job_group VARCHAR(100);

      ALTER TABLE payslips
      ADD COLUMN IF NOT EXISTS job_title VARCHAR(150);

      ALTER TABLE payslips
      ADD COLUMN IF NOT EXISTS housing_allowance NUMERIC DEFAULT 0;

      ALTER TABLE payslips
      ADD COLUMN IF NOT EXISTS food_allowance NUMERIC DEFAULT 0;

      ALTER TABLE payslips
      ADD COLUMN IF NOT EXISTS marriage_allowance NUMERIC DEFAULT 0;

      ALTER TABLE payslips
      ADD COLUMN IF NOT EXISTS child_allowance NUMERIC DEFAULT 0;

      ALTER TABLE payslips
      ADD COLUMN IF NOT EXISTS other_benefits NUMERIC DEFAULT 0;

      ALTER TABLE payslips
      ADD COLUMN IF NOT EXISTS other_deductions NUMERIC DEFAULT 0;
    `);

    console.log("ستون‌های جدید با موفقیت اضافه شدند.");

    const result = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'payslips'
      ORDER BY ordinal_position;
    `);

    console.log("ستون‌های جدول payslips:");

    result.rows.forEach((row) => {
      console.log(" -", row.column_name);
    });

  } catch (error) {
    console.error("خطا در بروزرسانی دیتابیس");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
  } finally {
    await pool.end();
  }
}

updatePayslipsTable();