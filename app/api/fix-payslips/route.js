import pool from "../../lib/db";

export async function GET() {
  try {
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

    return Response.json({
      success: true,
      message: "payslips table updated successfully",
    });
  } catch (error) {
    console.error("DATABASE ERROR:", error);

    return Response.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}