import { NextResponse } from "next/server";
import pool from "../../lib/db";

export async function GET() {
  try {
    await pool.query(`
      ALTER TABLE personnel
      ADD COLUMN IF NOT EXISTS company_id INTEGER
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_personnel_company_id
      ON personnel(company_id)
    `);

    return NextResponse.json({
      success: true,
      message: "ساختار ارتباط پرسنل و شرکت با موفقیت ساخته شد",
    });
  } catch (error) {
    console.error("SETUP PERSONNEL COMPANY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "خطا در ساخت ارتباط پرسنل و شرکت",
      },
      { status: 500 }
    );
  }
}