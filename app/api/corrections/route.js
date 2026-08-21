import { NextResponse } from "next/server";
import pool from "../../lib/db";

/*
  API مدیریت اصلاح فیش‌های حقوقی

  GET    → دریافت فیش‌ها برای صفحه اصلاحات
  PUT    → ویرایش و اصلاح یک فیش
  DELETE → حذف یک فیش
*/


// =====================================================
// GET
// دریافت لیست فیش‌ها
// =====================================================

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const year = searchParams.get("year") || "";
    const month = searchParams.get("month") || "";

    let query = `
      SELECT
        p.id,
        p.personnel_id,

        p.year,
        p.month,

        p.bank_account,
        p.job_group,
        p.job_title,

        p.base_salary,
        p.overtime,
        p.bonus,

        p.housing_allowance,
        p.food_allowance,
        p.marriage_allowance,
        p.child_allowance,
        p.other_benefits,

        p.insurance,
        p.tax,
        p.other_deductions,

        p.net_salary,

        p.created_at,

        e.full_name,
        e.national_id,
        e.personnel_code,
        e.department,
        e.job_title AS employee_job_title

      FROM payslips p

      LEFT JOIN personnel e
        ON p.personnel_id = e.id

      WHERE 1 = 1
    `;

    const values = [];
    let index = 1;


    // =================================================
    // جستجو
    // =================================================

    if (search.trim() !== "") {
      query += `
        AND (
          e.full_name ILIKE $${index}
          OR e.personnel_code ILIKE $${index}
          OR e.national_id ILIKE $${index}
        )
      `;

      values.push(`%${search.trim()}%`);
      index++;
    }


    // =================================================
    // فیلتر سال
    // =================================================

    if (year.trim() !== "") {
      query += `
        AND p.year = $${index}
      `;

      values.push(year.trim());
      index++;
    }


    // =================================================
    // فیلتر ماه
    // =================================================

    if (month.trim() !== "") {
      query += `
        AND p.month = $${index}
      `;

      values.push(month.trim());
      index++;
    }


    query += `
      ORDER BY p.id DESC
    `;


    const result = await pool.query(query, values);


    return NextResponse.json({
      success: true,
      data: result.rows,
    });

  } catch (error) {

    console.error(
      "GET corrections error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}



// =====================================================
// PUT
// اصلاح و ویرایش فیش
// =====================================================

export async function PUT(request) {
  try {

    const body = await request.json();

    const {
      id,

      year,
      month,

      bank_account,
      job_group,
      job_title,

      base_salary,
      overtime,
      bonus,

      housing_allowance,
      food_allowance,
      marriage_allowance,
      child_allowance,
      other_benefits,

      insurance,
      tax,
      other_deductions,
    } = body;


    // =================================================
    // بررسی شناسه فیش
    // =================================================

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "شناسه فیش وارد نشده است.",
        },
        {
          status: 400,
        }
      );
    }


    // =================================================
    // تبدیل مبالغ به عدد
    // =================================================

    const base = Number(base_salary) || 0;
    const overtimeValue = Number(overtime) || 0;
    const bonusValue = Number(bonus) || 0;

    const housingValue =
      Number(housing_allowance) || 0;

    const foodValue =
      Number(food_allowance) || 0;

    const marriageValue =
      Number(marriage_allowance) || 0;

    const childValue =
      Number(child_allowance) || 0;

    const otherBenefitsValue =
      Number(other_benefits) || 0;

    const insuranceValue =
      Number(insurance) || 0;

    const taxValue =
      Number(tax) || 0;

    const otherDeductionsValue =
      Number(other_deductions) || 0;


    // =================================================
    // محاسبه مجموع مزایا
    // =================================================

    const totalBenefits =
      overtimeValue +
      bonusValue +
      housingValue +
      foodValue +
      marriageValue +
      childValue +
      otherBenefitsValue;


    // =================================================
    // محاسبه مجموع کسورات
    // =================================================

    const totalDeductions =
      insuranceValue +
      taxValue +
      otherDeductionsValue;


    // =================================================
    // محاسبه خالص پرداختی
    // =================================================

    const netSalary =
      base +
      totalBenefits -
      totalDeductions;


    // =================================================
    // بررسی وجود فیش
    // =================================================

    const existing = await pool.query(
      `
      SELECT id
      FROM payslips
      WHERE id = $1
      `,
      [Number(id)]
    );


    if (existing.rows.length === 0) {

      return NextResponse.json(
        {
          success: false,
          error: "فیش موردنظر پیدا نشد.",
        },
        {
          status: 404,
        }
      );
    }


    // =================================================
    // بروزرسانی فیش
    // =================================================

    const result = await pool.query(
      `
      UPDATE payslips
      SET

        year = $1,
        month = $2,

        bank_account = $3,
        job_group = $4,
        job_title = $5,

        base_salary = $6,
        overtime = $7,
        bonus = $8,

        housing_allowance = $9,
        food_allowance = $10,
        marriage_allowance = $11,
        child_allowance = $12,
        other_benefits = $13,

        insurance = $14,
        tax = $15,
        other_deductions = $16,

        net_salary = $17

      WHERE id = $18

      RETURNING *
      `,
      [

        year || "1405",
        month || "فروردین",

        bank_account || "",
        job_group || "",
        job_title || "",

        base,
        overtimeValue,
        bonusValue,

        housingValue,
        foodValue,
        marriageValue,
        childValue,
        otherBenefitsValue,

        insuranceValue,
        taxValue,
        otherDeductionsValue,

        netSalary,

        Number(id),
      ]
    );


    return NextResponse.json({
      success: true,

      message:
        "فیش حقوقی با موفقیت اصلاح شد.",

      data: result.rows[0],

      calculation: {
        totalBenefits,
        totalDeductions,
        netSalary,
      },
    });

  } catch (error) {

    console.error(
      "PUT corrections error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}



// =====================================================
// DELETE
// حذف فیش
// =====================================================

export async function DELETE(request) {
  try {

    const body = await request.json();

    const { id } = body;


    if (!id) {

      return NextResponse.json(
        {
          success: false,
          error: "شناسه فیش وارد نشده است.",
        },
        {
          status: 400,
        }
      );
    }


    // =================================================
    // بررسی وجود فیش
    // =================================================

    const existing = await pool.query(
      `
      SELECT id
      FROM payslips
      WHERE id = $1
      `,
      [Number(id)]
    );


    if (existing.rows.length === 0) {

      return NextResponse.json(
        {
          success: false,
          error: "فیش موردنظر پیدا نشد.",
        },
        {
          status: 404,
        }
      );
    }


    // =================================================
    // حذف فیش
    // =================================================

    await pool.query(
      `
      DELETE FROM payslips
      WHERE id = $1
      `,
      [Number(id)]
    );


    return NextResponse.json({

      success: true,

      message:
        "فیش حقوقی با موفقیت حذف شد.",

    });

  } catch (error) {

    console.error(
      "DELETE corrections error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}