import { NextResponse } from "next/server";
import pool from "../../lib/db";
import { requireAdmin } from "../../lib/admin-auth";

export const dynamic = "force-dynamic";

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function calculate(body) {
  const base = toNumber(body.base_salary);
  const overtime = toNumber(body.overtime);
  const bonus = toNumber(body.bonus);
  const housing = toNumber(body.housing_allowance);
  const food = toNumber(body.food_allowance);
  const marriage = toNumber(body.marriage_allowance);
  const child = toNumber(body.child_allowance);
  const otherBenefits = toNumber(body.other_benefits);
  const insurance = toNumber(body.insurance);
  const tax = toNumber(body.tax);
  const otherDeductions = toNumber(body.other_deductions);
  const totalBenefits = overtime + bonus + housing + food + marriage + child + otherBenefits;
  const totalDeductions = insurance + tax + otherDeductions;
  return {
    base,
    overtime,
    bonus,
    housing,
    food,
    marriage,
    child,
    otherBenefits,
    insurance,
    tax,
    otherDeductions,
    totalBenefits,
    totalDeductions,
    netSalary: base + totalBenefits - totalDeductions,
  };
}

async function getEmployee(personnelId) {
  const result = await pool.query(
    `SELECT id, full_name, personnel_code, national_id, department, job_title, bank_account, job_group FROM personnel WHERE id=$1`,
    [personnelId]
  );
  return result.rows[0] || null;
}

async function getPayslipWithPeriod(payslipId) {
  const result = await pool.query(
    `SELECT p.id, p.payroll_period_id, pp.status AS period_status
     FROM payslips p
     LEFT JOIN payroll_periods pp ON pp.id = p.payroll_period_id
     WHERE p.id=$1`,
    [payslipId]
  );
  return result.rows[0] || null;
}

function closedPeriodResponse() {
  return NextResponse.json(
    { success: false, error: "این فیش متعلق به دوره بسته است و ویرایش یا حذف آن مجاز نیست." },
    { status: 409 }
  );
}

export async function GET(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  try {
    const result = await pool.query(`
      SELECT p.id, p.personnel_id, p.payroll_period_id, p.year, p.month, p.bank_account, p.job_group, p.job_title,
        p.base_salary, p.overtime, p.bonus, p.housing_allowance, p.food_allowance,
        p.marriage_allowance, p.child_allowance, p.other_benefits, p.insurance, p.tax,
        p.other_deductions, p.net_salary, p.created_at, e.full_name, e.personnel_code,
        e.national_id, e.department, e.job_title AS employee_job_title, e.company_id,
        c.name AS company_name, pp.status AS period_status
      FROM payslips p
      LEFT JOIN personnel e ON p.personnel_id=e.id
      LEFT JOIN companies c ON e.company_id=c.id
      LEFT JOIN payroll_periods pp ON p.payroll_period_id=pp.id
      ORDER BY p.id DESC
    `);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("GET payslips error:", error);
    return NextResponse.json({ success: false, error: error?.message || "خطا در دریافت فیش‌ها" }, { status: 500 });
  }
}

export async function POST(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  try {
    const body = await request.json();
    const personnelId = Number(body.personnel_id);
    if (!personnelId) return NextResponse.json({ success: false, error: "لطفاً کارمند را انتخاب کنید." }, { status: 400 });

    const employee = await getEmployee(personnelId);
    if (!employee) return NextResponse.json({ success: false, error: "کارمند انتخاب شده وجود ندارد." }, { status: 400 });

    const calc = calculate(body);
    if (calc.base <= 0) return NextResponse.json({ success: false, error: "حقوق پایه باید بیشتر از صفر باشد." }, { status: 400 });

    const result = await pool.query(`
      INSERT INTO payslips (personnel_id,year,month,bank_account,job_group,job_title,base_salary,overtime,bonus,housing_allowance,food_allowance,marriage_allowance,child_allowance,other_benefits,insurance,tax,other_deductions,net_salary)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *
    `, [personnelId, body.year ?? "1405", body.month ?? "فروردین", body.bank_account ?? employee.bank_account ?? "", body.job_group ?? employee.job_group ?? "", body.job_title ?? employee.job_title ?? "", calc.base, calc.overtime, calc.bonus, calc.housing, calc.food, calc.marriage, calc.child, calc.otherBenefits, calc.insurance, calc.tax, calc.otherDeductions, calc.netSalary]);

    return NextResponse.json({ success: true, message: "فیش حقوقی با موفقیت ثبت و صادر شد.", data: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("POST payslips error:", error);
    return NextResponse.json({ success: false, error: error?.message || "خطا در ثبت فیش حقوقی" }, { status: 500 });
  }
}

export async function PUT(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  try {
    const body = await request.json();
    const payslipId = Number(body.id);
    const personnelId = Number(body.personnel_id);
    if (!payslipId) return NextResponse.json({ success: false, error: "شناسه فیش مشخص نشده است." }, { status: 400 });
    if (!personnelId) return NextResponse.json({ success: false, error: "لطفاً کارمند را انتخاب کنید." }, { status: 400 });

    const existing = await getPayslipWithPeriod(payslipId);
    if (!existing) return NextResponse.json({ success: false, error: "فیش موردنظر پیدا نشد." }, { status: 404 });
    if (existing.period_status === "closed") return closedPeriodResponse();

    const employee = await getEmployee(personnelId);
    if (!employee) return NextResponse.json({ success: false, error: "کارمند انتخاب شده وجود ندارد." }, { status: 400 });

    const calc = calculate(body);
    if (calc.base <= 0) return NextResponse.json({ success: false, error: "حقوق پایه باید بیشتر از صفر باشد." }, { status: 400 });

    const result = await pool.query(`
      UPDATE payslips SET personnel_id=$1,year=$2,month=$3,bank_account=$4,job_group=$5,job_title=$6,
        base_salary=$7,overtime=$8,bonus=$9,housing_allowance=$10,food_allowance=$11,
        marriage_allowance=$12,child_allowance=$13,other_benefits=$14,insurance=$15,tax=$16,
        other_deductions=$17,net_salary=$18 WHERE id=$19 RETURNING *
    `, [personnelId, body.year ?? "1405", body.month ?? "فروردین", body.bank_account ?? employee.bank_account ?? "", body.job_group ?? employee.job_group ?? "", body.job_title ?? employee.job_title ?? "", calc.base, calc.overtime, calc.bonus, calc.housing, calc.food, calc.marriage, calc.child, calc.otherBenefits, calc.insurance, calc.tax, calc.otherDeductions, calc.netSalary, payslipId]);

    return NextResponse.json({ success: true, message: "فیش حقوقی با موفقیت ویرایش شد.", data: result.rows[0] });
  } catch (error) {
    console.error("PUT payslips error:", error);
    return NextResponse.json({ success: false, error: error?.message || "خطا در ویرایش فیش حقوقی" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ success: false, error: "شناسه فیش مشخص نشده است." }, { status: 400 });

    const existing = await getPayslipWithPeriod(id);
    if (!existing) return NextResponse.json({ success: false, error: "فیش موردنظر پیدا نشد." }, { status: 404 });
    if (existing.period_status === "closed") return closedPeriodResponse();

    const result = await pool.query("DELETE FROM payslips WHERE id=$1 RETURNING id", [id]);
    if (!result.rows.length) return NextResponse.json({ success: false, error: "فیش موردنظر پیدا نشد." }, { status: 404 });
    return NextResponse.json({ success: true, message: "فیش حقوقی با موفقیت حذف شد." });
  } catch (error) {
    console.error("DELETE payslip error:", error);
    return NextResponse.json({ success: false, error: error?.message || "خطا در حذف فیش حقوقی" }, { status: 500 });
  }
}
