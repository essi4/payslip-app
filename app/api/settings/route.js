import { NextResponse } from "next/server";
import pool from "../../lib/db";

/* =========================================================
   ساخت جدول تنظیمات
========================================================= */

async function createSettingsTable() {
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
    );
  `);

  /* اگر تنظیمات هنوز وجود نداشته باشد،
     یک رکورد اولیه ایجاد می‌کنیم */

  const check = await pool.query(`
    SELECT id
    FROM settings
    ORDER BY id ASC
    LIMIT 1
  `);

  if (check.rows.length === 0) {
    await pool.query(`
      INSERT INTO settings (
        company_name,
        system_title,
        fiscal_year,
        current_month,
        currency,
        phone,
        email,
        address,
        manager_name,
        manager_position,
        show_company_name,
        show_bank_account,
        show_job_group,
        show_job_title,
        footer_text,
        print_orientation
      )
      VALUES (
        '',
        'سیستم حقوق و دستمزد',
        '1405',
        'فروردین',
        'تومان',
        '',
        '',
        '',
        '',
        '',
        true,
        true,
        true,
        true,
        '',
        'portrait'
      )
    `);
  }
}

/* =========================================================
   GET
   دریافت تنظیمات
========================================================= */

export async function GET() {
  try {
    await createSettingsTable();

    const result = await pool.query(`
      SELECT *
      FROM settings
      ORDER BY id ASC
      LIMIT 1
    `);

    return NextResponse.json({
      success: true,
      data: result.rows[0] || null,
    });
  } catch (error) {
    console.error("GET SETTINGS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "خطا در دریافت تنظیمات سامانه",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST
   ذخیره تنظیمات
========================================================= */

export async function POST(request) {
  try {
    await createSettingsTable();

    const body = await request.json();

    const company_name =
      body.company_name ?? "";

    const system_title =
      body.system_title ??
      "سیستم حقوق و دستمزد";

    const fiscal_year =
      body.fiscal_year ??
      "1405";

    const current_month =
      body.current_month ??
      "فروردین";

    const currency =
      body.currency ??
      "تومان";

    const phone =
      body.phone ??
      "";

    const email =
      body.email ??
      "";

    const address =
      body.address ??
      "";

    const manager_name =
      body.manager_name ??
      "";

    const manager_position =
      body.manager_position ??
      "";

    const show_company_name =
      body.show_company_name !== false;

    const show_bank_account =
      body.show_bank_account !== false;

    const show_job_group =
      body.show_job_group !== false;

    const show_job_title =
      body.show_job_title !== false;

    const footer_text =
      body.footer_text ??
      "";

    const print_orientation =
      body.print_orientation ??
      "portrait";

    /* بررسی جهت چاپ */

    const validOrientations = [
      "portrait",
      "landscape",
    ];

    const finalOrientation =
      validOrientations.includes(
        print_orientation
      )
        ? print_orientation
        : "portrait";

    const result = await pool.query(
      `
      UPDATE settings
      SET
        company_name = $1,
        system_title = $2,
        fiscal_year = $3,
        current_month = $4,
        currency = $5,
        phone = $6,
        email = $7,
        address = $8,
        manager_name = $9,
        manager_position = $10,
        show_company_name = $11,
        show_bank_account = $12,
        show_job_group = $13,
        show_job_title = $14,
        footer_text = $15,
        print_orientation = $16,
        updated_at = CURRENT_TIMESTAMP

      WHERE id = (
        SELECT id
        FROM settings
        ORDER BY id ASC
        LIMIT 1
      )

      RETURNING *
      `,
      [
        company_name,
        system_title,
        fiscal_year,
        current_month,
        currency,
        phone,
        email,
        address,
        manager_name,
        manager_position,
        show_company_name,
        show_bank_account,
        show_job_group,
        show_job_title,
        footer_text,
        finalOrientation,
      ]
    );

    return NextResponse.json({
      success: true,
      message:
        "تنظیمات با موفقیت ذخیره شد.",
      data:
        result.rows[0] || null,
    });
  } catch (error) {
    console.error(
      "POST SETTINGS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "خطا در ذخیره تنظیمات سامانه",
      },
      {
        status: 500,
      }
    );
  }
}