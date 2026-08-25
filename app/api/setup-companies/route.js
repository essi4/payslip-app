import { NextResponse } from "next/server";
import pool from "../../lib/db";

export async function GET() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      ALTER TABLE personnel
      ADD COLUMN IF NOT EXISTS company_id INTEGER;
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_personnel_company_id
      ON personnel(company_id);
    `);

    return NextResponse.json({
      success: true,
      message: "ساختار شرکت‌ها با موفقیت ساخته شد",
    });
  } catch (error) {
    console.error("SETUP COMPANIES ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}