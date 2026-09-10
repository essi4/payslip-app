import pool from "../../lib/db";
import { requireAdmin } from "../../lib/admin-auth";
import { hashPassword } from "../../lib/password";

export async function GET(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  try {
    const result = await pool.query(`SELECT p.id, p.full_name, p.national_id, p.personnel_code, p.department, p.job_title, p.bank_account, p.job_group, p.company_id, p.created_at, c.name AS company_name FROM personnel p LEFT JOIN companies c ON c.id=p.company_id ORDER BY p.id DESC`);
    return Response.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Personnel GET error:", error);
    return Response.json({ success: false, error: "خطا در دریافت کارکنان" }, { status: 500 });
  }
}

async function companyExists(companyId) {
  const result = await pool.query("SELECT id FROM companies WHERE id=$1", [companyId]);
  return result.rowCount > 0;
}
function cleanNationalId(value) { return String(value || "").replace(/[^0-9]/g, ""); }

export async function POST(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  try {
    const body = await request.json();
    const companyId = Number(body.company_id); const fullName = String(body.full_name || "").trim(); const nationalId = cleanNationalId(body.national_id); const personnelCode = String(body.personnel_code || "").trim();
    if (!Number.isInteger(companyId) || companyId <= 0) return Response.json({ success: false, error: "لطفاً شرکت را انتخاب کنید." }, { status: 400 });
    if (!fullName) return Response.json({ success: false, error: "نام و نام خانوادگی الزامی است." }, { status: 400 });
    if (nationalId.length !== 10) return Response.json({ success: false, error: "کد ملی باید ۱۰ رقم باشد." }, { status: 400 });
    if (!personnelCode) return Response.json({ success: false, error: "کد پرسنلی الزامی است." }, { status: 400 });
    if (!(await companyExists(companyId))) return Response.json({ success: false, error: "شرکت انتخاب‌شده پیدا نشد." }, { status: 400 });
    const password = String(body.payslip_password || "").trim(); const passwordHash = password ? await hashPassword(password) : null;
    const result = await pool.query(`INSERT INTO personnel (company_id, full_name, national_id, personnel_code, department, job_title, bank_account, job_group, payslip_password) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, full_name, national_id, personnel_code, department, job_title, bank_account, job_group, company_id, created_at`, [companyId, fullName, nationalId, personnelCode, body.department?.trim() || null, body.job_title?.trim() || null, body.bank_account?.trim() || null, body.job_group?.trim() || null, passwordHash]);
    return Response.json({ success: true, data: result.rows[0] });
  } catch (error) { console.error("Personnel POST error:", error); return Response.json({ success: false, error: "خطا در ثبت کارمند" }, { status: 500 }); }
}

export async function PUT(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  try {
    const body = await request.json(); const id = Number(body.id); const companyId = Number(body.company_id);
    if (!Number.isInteger(id) || id <= 0) return Response.json({ success: false, error: "شناسه کارمند نامعتبر است." }, { status: 400 });
    if (!Number.isInteger(companyId) || companyId <= 0) return Response.json({ success: false, error: "لطفاً شرکت را انتخاب کنید." }, { status: 400 });
    if (!(await companyExists(companyId))) return Response.json({ success: false, error: "شرکت انتخاب‌شده پیدا نشد." }, { status: 400 });
    const existing = await pool.query("SELECT id, company_id, payslip_password FROM personnel WHERE id=$1", [id]);
    if (!existing.rowCount) return Response.json({ success: false, error: "کارمند پیدا نشد." }, { status: 404 });
    const existingCompanyId = Number(existing.rows[0].company_id);
    if (existingCompanyId !== companyId) {
      const payslips = await pool.query("SELECT COUNT(*)::int AS count FROM payslips WHERE personnel_id=$1", [id]);
      if (Number(payslips.rows[0]?.count || 0) > 0) return Response.json({ success: false, error: "کارمندی که سابقه فیش حقوقی دارد قابل انتقال به شرکت دیگر نیست." }, { status: 409 });
    }
    const nationalId = cleanNationalId(body.national_id);
    if (nationalId.length !== 10) return Response.json({ success: false, error: "کد ملی باید ۱۰ رقم باشد." }, { status: 400 });
    const suppliedPassword = String(body.payslip_password || "").trim();
    const passwordHash = suppliedPassword ? await hashPassword(suppliedPassword) : existing.rows[0].payslip_password;
    const result = await pool.query(`UPDATE personnel SET company_id=$1, full_name=$2, national_id=$3, personnel_code=$4, department=$5, job_title=$6, bank_account=$7, job_group=$8, payslip_password=$9 WHERE id=$10 RETURNING id, full_name, national_id, personnel_code, department, job_title, bank_account, job_group, company_id, created_at`, [companyId, String(body.full_name || "").trim(), nationalId, String(body.personnel_code || "").trim(), body.department?.trim() || null, body.job_title?.trim() || null, body.bank_account?.trim() || null, body.job_group?.trim() || null, passwordHash, id]);
    return Response.json({ success: true, data: result.rows[0] });
  } catch (error) { console.error("Personnel PUT error:", error); return Response.json({ success: false, error: "خطا در ویرایش کارمند" }, { status: 500 }); }
}

export async function DELETE(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  try {
    const body = await request.json(); const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return Response.json({ success: false, error: "شناسه کارمند نامعتبر است." }, { status: 400 });
    const payslips = await pool.query("SELECT COUNT(*)::int AS count FROM payslips WHERE personnel_id=$1", [id]);
    if (Number(payslips.rows[0]?.count || 0) > 0) return Response.json({ success: false, error: "کارمندی که سابقه فیش حقوقی دارد قابل حذف نیست." }, { status: 409 });
    const result = await pool.query("DELETE FROM personnel WHERE id=$1 RETURNING id", [id]);
    if (!result.rowCount) return Response.json({ success: false, error: "کارمند پیدا نشد." }, { status: 404 });
    return Response.json({ success: true });
  } catch (error) { console.error("Personnel DELETE error:", error); return Response.json({ success: false, error: "خطا در حذف کارمند" }, { status: 500 }); }
}
