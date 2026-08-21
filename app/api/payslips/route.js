import { NextResponse } from "next/server";
import pool from "../../lib/db";

/* =========================================================
   GET
   دریافت همه فیش‌ها
========================================================= */
export async function GET() {
  try {
    const result = await pool.query(`
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
        e.personnel_code,
        e.national_id,
        e.department,
        e.job_title AS employee_job_title

      FROM payslips p

      LEFT JOIN personnel e
        ON p.personnel_id = e.id

      ORDER BY p.id DESC
    `);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("GET payslips error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "خطا در دریافت فیش‌ها",
      },
      { status: 500 }
    );
  }
}


/* =========================================================
   POST
   ثبت فیش جدید
========================================================= */
export async function POST(request) {
  try {
    const body = await request.json();

    const {
      personnel_id,
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

    /* -----------------------------------------------------
       بررسی کارمند
    ----------------------------------------------------- */

    const personnelId = Number(personnel_id);

    if (!personnelId) {
      return NextResponse.json(
        {
          success: false,
          error: "لطفاً کارمند را انتخاب کنید.",
        },
        { status: 400 }
      );
    }

    /* -----------------------------------------------------
       تبدیل اعداد
    ----------------------------------------------------- */

    const base = Number(base_salary) || 0;
    const overtimeValue = Number(overtime) || 0;
    const bonusValue = Number(bonus) || 0;

    const housingValue = Number(housing_allowance) || 0;
    const foodValue = Number(food_allowance) || 0;
    const marriageValue = Number(marriage_allowance) || 0;
    const childValue = Number(child_allowance) || 0;
    const otherBenefitsValue = Number(other_benefits) || 0;

    const insuranceValue = Number(insurance) || 0;
    const taxValue = Number(tax) || 0;
    const otherDeductionsValue = Number(other_deductions) || 0;

    /* -----------------------------------------------------
       بررسی حقوق پایه
    ----------------------------------------------------- */

    if (base <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "حقوق پایه باید بیشتر از صفر باشد.",
        },
        { status: 400 }
      );
    }

    /* -----------------------------------------------------
       بررسی وجود کارمند
    ----------------------------------------------------- */

    const employee = await pool.query(
      `
      SELECT
        id,
        full_name,
        personnel_code,
        national_id,
        department,
        job_title,
        bank_account,
        job_group
      FROM personnel
      WHERE id = $1
      `,
      [personnelId]
    );

    if (employee.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "کارمند انتخاب شده در جدول personnel وجود ندارد.",
        },
        { status: 400 }
      );
    }

    const employeeData = employee.rows[0];

    /* -----------------------------------------------------
       اطلاعات خالی را از مشخصات کارمند پر کن
    ----------------------------------------------------- */

    const finalBankAccount =
      bank_account ?? employeeData.bank_account ?? "";

    const finalJobGroup =
      job_group ?? employeeData.job_group ?? "";

    const finalJobTitle =
      job_title ?? employeeData.job_title ?? "";

    /* -----------------------------------------------------
       محاسبه مزایا
    ----------------------------------------------------- */

    const totalBenefits =
      overtimeValue +
      bonusValue +
      housingValue +
      foodValue +
      marriageValue +
      childValue +
      otherBenefitsValue;

    /* -----------------------------------------------------
       محاسبه کسورات
    ----------------------------------------------------- */

    const totalDeductions =
      insuranceValue +
      taxValue +
      otherDeductionsValue;

    /* -----------------------------------------------------
       محاسبه خالص پرداختی
    ----------------------------------------------------- */

    const netSalary =
      base +
      totalBenefits -
      totalDeductions;

    /* -----------------------------------------------------
       ثبت فیش
       
       توجه:
       اینجا دقیقاً 18 ستون
       و دقیقاً 18 مقدار داریم.
    ----------------------------------------------------- */

    const result = await pool.query(
      `
      INSERT INTO payslips (
        personnel_id,
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

        net_salary
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16,
        $17,
        $18
      )
      RETURNING *
      `,
      [
        personnelId,

        year || "1405",
        month || "فروردین",

        finalBankAccount,
        finalJobGroup,
        finalJobTitle,

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
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "فیش حقوقی با موفقیت ثبت و صادر شد.",
        data: result.rows[0],
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("POST payslips error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "خطا در ثبت فیش حقوقی",
      },
      { status: 500 }
    );
  }
}


/* =========================================================
   PUT
   ویرایش فیش حقوقی
========================================================= */
export async function PUT(request) {
  try {
    const body = await request.json();

    const {
      id,
      personnel_id,

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

    const payslipId = Number(id);
    const personnelId = Number(personnel_id);

    /* -----------------------------------------------------
       بررسی ID
    ----------------------------------------------------- */

    if (!payslipId) {
      return NextResponse.json(
        {
          success: false,
          error: "شناسه فیش مشخص نشده است.",
        },
        { status: 400 }
      );
    }

    /* -----------------------------------------------------
       بررسی کارمند
    ----------------------------------------------------- */

    if (!personnelId) {
      return NextResponse.json(
        {
          success: false,
          error: "لطفاً کارمند را انتخاب کنید.",
        },
        { status: 400 }
      );
    }

    /* -----------------------------------------------------
       تبدیل اعداد
    ----------------------------------------------------- */

    const base = Number(base_salary) || 0;
    const overtimeValue = Number(overtime) || 0;
    const bonusValue = Number(bonus) || 0;

    const housingValue = Number(housing_allowance) || 0;
    const foodValue = Number(food_allowance) || 0;
    const marriageValue = Number(marriage_allowance) || 0;
    const childValue = Number(child_allowance) || 0;
    const otherBenefitsValue = Number(other_benefits) || 0;

    const insuranceValue = Number(insurance) || 0;
    const taxValue = Number(tax) || 0;
    const otherDeductionsValue = Number(other_deductions) || 0;

    /* -----------------------------------------------------
       بررسی حقوق پایه
    ----------------------------------------------------- */

    if (base <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "حقوق پایه باید بیشتر از صفر باشد.",
        },
        { status: 400 }
      );
    }

    /* -----------------------------------------------------
       بررسی وجود فیش
    ----------------------------------------------------- */

    const existing = await pool.query(
      `
      SELECT id
      FROM payslips
      WHERE id = $1
      `,
      [payslipId]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "فیش موردنظر پیدا نشد.",
        },
        { status: 404 }
      );
    }

    /* -----------------------------------------------------
       بررسی وجود کارمند
    ----------------------------------------------------- */

    const employee = await pool.query(
      `
      SELECT
        id,
        bank_account,
        job_group,
        job_title
      FROM personnel
      WHERE id = $1
      `,
      [personnelId]
    );

    if (employee.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "کارمند انتخاب شده وجود ندارد.",
        },
        { status: 400 }
      );
    }

    const employeeData = employee.rows[0];

    /* -----------------------------------------------------
       اطلاعات نهایی
    ----------------------------------------------------- */

    const finalBankAccount =
      bank_account ?? employeeData.bank_account ?? "";

    const finalJobGroup =
      job_group ?? employeeData.job_group ?? "";

    const finalJobTitle =
      job_title ?? employeeData.job_title ?? "";

    /* -----------------------------------------------------
       محاسبه مزایا
    ----------------------------------------------------- */

    const totalBenefits =
      overtimeValue +
      bonusValue +
      housingValue +
      foodValue +
      marriageValue +
      childValue +
      otherBenefitsValue;

    /* -----------------------------------------------------
       محاسبه کسورات
    ----------------------------------------------------- */

    const totalDeductions =
      insuranceValue +
      taxValue +
      otherDeductionsValue;

    /* -----------------------------------------------------
       محاسبه خالص
    ----------------------------------------------------- */

    const netSalary =
      base +
      totalBenefits -
      totalDeductions;

    /* -----------------------------------------------------
       بروزرسانی
    ----------------------------------------------------- */

    const result = await pool.query(
      `
      UPDATE payslips
      SET
        personnel_id = $1,
        year = $2,
        month = $3,

        bank_account = $4,
        job_group = $5,
        job_title = $6,

        base_salary = $7,
        overtime = $8,
        bonus = $9,

        housing_allowance = $10,
        food_allowance = $11,
        marriage_allowance = $12,
        child_allowance = $13,
        other_benefits = $14,

        insurance = $15,
        tax = $16,
        other_deductions = $17,

        net_salary = $18

      WHERE id = $19

      RETURNING *
      `,
      [
        personnelId,

        year || "1405",
        month || "فروردین",

        finalBankAccount,
        finalJobGroup,
        finalJobTitle,

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

        payslipId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "فیش حقوقی با موفقیت ویرایش شد.",
      data: result.rows[0],
    });

  } catch (error) {
    console.error("PUT payslips error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "خطا در ویرایش فیش حقوقی",
      },
      { status: 500 }
    );
  }
}


/* =========================================================
   DELETE
   حذف فیش حقوقی
========================================================= */
export async function DELETE(request) {
  try {
    const body = await request.json();

    const id = Number(body.id);

    /* -----------------------------------------------------
       بررسی ID
    ----------------------------------------------------- */

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "شناسه فیش مشخص نشده است.",
        },
        { status: 400 }
      );
    }

    /* -----------------------------------------------------
       بررسی وجود فیش
    ----------------------------------------------------- */

    const existing = await pool.query(
      `
      SELECT id
      FROM payslips
      WHERE id = $1
      `,
      [id]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "فیش موردنظر پیدا نشد.",
        },
        { status: 404 }
      );
    }

    /* -----------------------------------------------------
       حذف
    ----------------------------------------------------- */

    await pool.query(
      `
      DELETE FROM payslips
      WHERE id = $1
      `,
      [id]
    );

    return NextResponse.json({
      success: true,
      message: "فیش حقوقی با موفقیت حذف شد.",
    });

  } catch (error) {
    console.error("DELETE payslip error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "خطا در حذف فیش حقوقی",
      },
      { status: 500 }
    );
  }
}