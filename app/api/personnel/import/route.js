import { NextResponse } from "next/server";
import pool from "../../../lib/db";

export async function POST(request) {
  try {
    const body = await request.json();

    const employees = body.employees;

    if (!Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "هیچ اطلاعاتی برای ورود ارسال نشده است.",
        },
        { status: 400 }
      );
    }

    let inserted = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];

      const fullName = String(employee.full_name || "").trim();
      const nationalId = String(employee.national_id || "").trim();
      const personnelCode = String(employee.personnel_code || "").trim();
      const bankAccount = String(employee.bank_account || "").trim();
      const department = String(employee.department || "").trim();
      const jobGroup = String(employee.job_group || "").trim();
      const jobTitle = String(employee.job_title || "").trim();

      if (!fullName || !nationalId || !personnelCode) {
        skipped++;

        errors.push({
          row: i + 2,
          error: "نام، کد ملی یا کد پرسنلی ناقص است.",
        });

        continue;
      }

      try {
        const existing = await pool.query(
          `
          SELECT id
          FROM personnel
          WHERE national_id = $1
             OR personnel_code = $2
          LIMIT 1
          `,
          [nationalId, personnelCode]
        );

        if (existing.rows.length > 0) {
          skipped++;

          errors.push({
            row: i + 2,
            error: `پرسنل با کد ملی ${nationalId} یا کد پرسنلی ${personnelCode} قبلاً ثبت شده است.`,
          });

          continue;
        }

        await pool.query(
          `
          INSERT INTO personnel
          (
            full_name,
            national_id,
            personnel_code,
            bank_account,
            department,
            job_group,
            job_title
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
          [
            fullName,
            nationalId,
            personnelCode,
            bankAccount || null,
            department || null,
            jobGroup || null,
            jobTitle || null,
          ]
        );

        inserted++;
      } catch (error) {
        skipped++;

        errors.push({
          row: i + 2,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "ورود گروهی با موفقیت انجام شد.",
      inserted,
      skipped,
      errors,
    });
  } catch (error) {
    console.error("IMPORT PERSONNEL ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "خطا در ورود اطلاعات Excel.",
      },
      { status: 500 }
    );
  }
}