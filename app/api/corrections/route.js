import { NextResponse } from "next/server";
import pool from "../../lib/db";
import { requireAdmin } from "../../lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const year = searchParams.get("year") || "";
    const month = searchParams.get("month") || "";
    const values = [];
    let index = 1;

    let query = `
      SELECT p.id, p.personnel_id, p.year, p.month,
        p.bank_account, p.job_group, p.job_title,
        p.base_salary, p.overtime, p.bonus,
        p.housing_allowance, p.food_allowance,
        p.marriage_allowance, p.child_allowance, p.other_benefits,
        p.insurance, p.tax, p.other_deductions, p.net_salary,
        p.created_at, e.full_name, e.national_id, e.personnel_code,
        e.department, e.job_title AS employee_job_title
      FROM payslips p
      LEFT JOIN personnel e ON p.personnel_id = e.id
      WHERE 1 = 1
    `;

    if (search.trim()) {
      query += ` AND (e.full_name ILIKE $${index} OR e.personnel_code ILIKE $${index} OR e.national_id ILIKE $${index})`;
      values.push(`%${search.trim()}%`);
      index++;
    }

    if (year.trim()) {
      query += ` AND p.year = $${index}`;
      values.push(year.trim());
      index++;
    }

    if (month.trim()) {
      query += ` AND p.month = $${index}`;
      values.push(month.trim());
      index++;
    }

    query += " ORDER BY p.id DESC";

    const result = await pool.query(query, values);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("GET corrections error:", error);
    return NextResponse.json({ success: false, error: error.message || "خطا در دریافت اصلاحات" }, { status: 500 });
  }
}

export async function PUT(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ success: false, error: "شناسه فیش وارد نشده است." }, { status: 400 });

    const base = Number(body.base_salary) || 0;
    if (base <= 0) return NextResponse.json({ success: false, error: "حقوق پایه باید بیشتر از صفر باشد." }, { status: 400 });

    const overtime = Number(body.overtime) || 0;
    const bonus = Number(body.bonus) || 0;
    const housing = Number(body.housing_allowance) || 0;
    const food = Number(body.food_allowance) || 0;
    const marriage = Number(body.marriage_allowance) || 0;
    const child = Number(body.child_allowance) || 0;
    const otherBenefits = Number(body.other_benefits) || 0;
    const insurance = Number(body.insurance) || 0;
    const tax = Number(body.tax) || 0;
    const otherDeductions = Number(body.other_deductions) || 0;
    const totalBenefits = overtime + bonus + housing + food + marriage + child + otherBenefits;
    const totalDeductions = insurance + tax + otherDeductions;
    const netSalary = base + totalBenefits - totalDeductions;

    const existing = await pool.query("SELECT id FROM payslips WHERE id = $1", [id]);
    if (!existing.rows.length) return NextResponse.json({ success: false, error: "فیش موردنظر پیدا نشد." }, { status: 404 });

    const result = await pool.query(`
      UPDATE payslips SET
        year=$1, month=$2, bank_account=$3, job_group=$4, job_title=$5,
        base_salary=$6, overtime=$7, bonus=$8,
        housing_allowance=$9, food_allowance=$10, marriage_allowance=$11,
        child_allowance=$12, other_benefits=$13, insurance=$14, tax=$15,
        other_deductions=$16, net_salary=$17
      WHERE id=$18 RETURNING *
    `, [
      body.year || "1405", body.month || "فروردین",
      body.bank_account || "", body.job_group || "", body.job_title || "",
      base, overtime, bonus, housing, food, marriage, child, otherBenefits,
      insurance, tax, otherDeductions, netSalary, id,
    ]);

    return NextResponse.json({ success: true, message: "فیش حقوقی با موفقیت اصلاح شد.", data: result.rows[0], calculation: { totalBenefits, totalDeductions, netSalary } });
  } catch (error) {
    console.error("PUT corrections error:", error);
    return NextResponse.json({ success: false, error: error.message || "خطا در اصلاح فیش" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ success: false, error: "شناسه فیش وارد نشده است." }, { status: 400 });

    const result = await pool.query("DELETE FROM payslips WHERE id=$1 RETURNING id", [id]);
    if (!result.rows.length) return NextResponse.json({ success: false, error: "فیش موردنظر پیدا نشد." }, { status: 404 });

    return NextResponse.json({ success: true, message: "فیش حقوقی با موفقیت حذف شد." });
  } catch (error) {
    console.error("DELETE corrections error:", error);
    return NextResponse.json({ success: false, error: error.message || "خطا در حذف فیش" }, { status: 500 });
  }
}