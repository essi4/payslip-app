import { NextResponse } from "next/server";
import pool from "../../lib/db";
import { requireAdmin } from "../../lib/admin-auth";

export const dynamic = "force-dynamic";

async function createSettingsTable() {
  let tableExists = false;

  try {
    const checkTable = await pool.query(`SELECT to_regclass('public.settings') AS table_name`);
    tableExists = Boolean(checkTable.rows[0]?.table_name);

    if (!tableExists) {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS settings (
            id SERIAL PRIMARY KEY,
            company_name VARCHAR(200) DEFAULT '',
            system_title VARCHAR(200) DEFAULT 'سیستم حقوق و دستمزد',
            fiscal_year VARCHAR(10) DEFAULT '1405',
            current_month VARCHAR(30) DEFAULT 'فروردین',
            currency VARCHAR(20) DEFAULT 'تومان',
            phone VARCHAR(50) DEFAULT '',
            email VARCHAR(150) DEFAULT '',
            address TEXT DEFAULT '',
            manager_name VARCHAR(200) DEFAULT '',
            manager_position VARCHAR(200) DEFAULT '',
            show_company_name BOOLEAN DEFAULT true,
            show_bank_account BOOLEAN DEFAULT true,
            show_job_group BOOLEAN DEFAULT true,
            show_job_title BOOLEAN DEFAULT true,
            footer_text TEXT DEFAULT '',
            print_orientation VARCHAR(20) DEFAULT 'portrait',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        tableExists = true;
      } catch (error) {
        // A stale settings_id_seq can collide with PostgreSQL's CREATE SEQUENCE
        // during a first request. Fall back to a fixed integer primary key.
        if (error?.code !== "23505") throw error;

        const retryCheck = await pool.query(`SELECT to_regclass('public.settings') AS table_name`);
        tableExists = Boolean(retryCheck.rows[0]?.table_name);

        if (!tableExists) {
          await pool.query(`
            CREATE TABLE IF NOT EXISTS settings (
              id INTEGER PRIMARY KEY,
              company_name VARCHAR(200) DEFAULT '',
              system_title VARCHAR(200) DEFAULT 'سیستم حقوق و دستمزد',
              fiscal_year VARCHAR(10) DEFAULT '1405',
              current_month VARCHAR(30) DEFAULT 'فروردین',
              currency VARCHAR(20) DEFAULT 'تومان',
              phone VARCHAR(50) DEFAULT '',
              email VARCHAR(150) DEFAULT '',
              address TEXT DEFAULT '',
              manager_name VARCHAR(200) DEFAULT '',
              manager_position VARCHAR(200) DEFAULT '',
              show_company_name BOOLEAN DEFAULT true,
              show_bank_account BOOLEAN DEFAULT true,
              show_job_group BOOLEAN DEFAULT true,
              show_job_title BOOLEAN DEFAULT true,
              footer_text TEXT DEFAULT '',
              print_orientation VARCHAR(20) DEFAULT 'portrait',
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          tableExists = true;
        }
      }
    }
  } catch (error) {
    throw error;
  }

  if (!tableExists) throw new Error("جدول تنظیمات سامانه ایجاد نشد.");

  const check = await pool.query("SELECT id FROM settings ORDER BY id ASC LIMIT 1");
  if (!check.rows.length) {
    try {
      // Explicit id=1 also works with the fallback table that has no SERIAL sequence.
      await pool.query(`
        INSERT INTO settings (
          id, company_name, system_title, fiscal_year, current_month, currency,
          phone, email, address, manager_name, manager_position,
          show_company_name, show_bank_account, show_job_group, show_job_title,
          footer_text, print_orientation
        ) VALUES (1, '', 'سیستم حقوق و دستمزد', '1405', 'فروردین', 'تومان', '', '', '', '', '', true, true, true, true, '', 'portrait')
      `);
    } catch (error) {
      // Another concurrent request may have inserted the first row; that is safe to ignore.
      if (error?.code !== "23505") throw error;
    }
  }
}

export async function GET(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    await createSettingsTable();
    const result = await pool.query("SELECT * FROM settings ORDER BY id ASC LIMIT 1");
    return NextResponse.json({ success: true, data: result.rows[0] || null });
  } catch (error) {
    console.error("GET SETTINGS ERROR:", error);
    return NextResponse.json({ success: false, error: error?.message || "خطا در دریافت تنظیمات سامانه" }, { status: 500 });
  }
}

export async function POST(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    await createSettingsTable();
    const body = await request.json();
    const orientation = ["portrait", "landscape"].includes(body.print_orientation) ? body.print_orientation : "portrait";

    const result = await pool.query(`
      UPDATE settings SET
        company_name=$1, system_title=$2, fiscal_year=$3, current_month=$4,
        currency=$5, phone=$6, email=$7, address=$8, manager_name=$9,
        manager_position=$10, show_company_name=$11, show_bank_account=$12,
        show_job_group=$13, show_job_title=$14, footer_text=$15,
        print_orientation=$16, updated_at=CURRENT_TIMESTAMP
      WHERE id=(SELECT id FROM settings ORDER BY id ASC LIMIT 1)
      RETURNING *
    `, [
      body.company_name ?? "", body.system_title ?? "سیستم حقوق و دستمزد",
      body.fiscal_year ?? "1405", body.current_month ?? "فروردین",
      body.currency ?? "تومان", body.phone ?? "", body.email ?? "",
      body.address ?? "", body.manager_name ?? "", body.manager_position ?? "",
      body.show_company_name !== false, body.show_bank_account !== false,
      body.show_job_group !== false, body.show_job_title !== false,
      body.footer_text ?? "", orientation,
    ]);

    return NextResponse.json({ success: true, message: "تنظیمات با موفقیت ذخیره شد.", data: result.rows[0] || null });
  } catch (error) {
    console.error("POST SETTINGS ERROR:", error);
    return NextResponse.json({ success: false, error: error?.message || "خطا در ذخیره تنظیمات سامانه" }, { status: 500 });
  }
}