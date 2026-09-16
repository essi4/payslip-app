import pool from "../../lib/db";
import { requireAdmin } from "../../lib/admin-auth";
import { hashPassword } from "../../lib/password";

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!email) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? email : undefined;
}

async function ensurePersonnelColumns() {
  await pool.query(`
    ALTER TABLE personnel
      ADD COLUMN IF NOT EXISTS email TEXT,
      ADD COLUMN IF NOT EXISTS mobile TEXT,
      ADD COLUMN IF NOT EXISTS marital_status TEXT,
      ADD COLUMN IF NOT EXISTS children_count INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS hire_date TEXT,
      ADD COLUMN IF NOT EXISTS last_order_number TEXT,
      ADD COLUMN IF NOT EXISTS last_order_date TEXT,
      ADD COLUMN IF NOT EXISTS bank_iban TEXT,
      ADD COLUMN IF NOT EXISTS bank_name TEXT,
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE
  `);
}

async function ensureWageGroups() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wage_groups (
      id SERIAL PRIMARY KEY,
      group_number INTEGER NOT NULL UNIQUE CHECK (group_number BETWEEN 1 AND 20),
      year INTEGER NOT NULL DEFAULT 1405,
      daily_base_salary NUMERIC NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  for (let groupNumber = 1; groupNumber <= 20; groupNumber += 1) {
    await pool.query(
      `INSERT INTO wage_groups (group_number, year, daily_base_salary)
       VALUES ($1, 1405, $2)
       ON CONFLICT (group_number) DO NOTHING`,
      [groupNumber, groupNumber === 6 ? 6292029 : 0]
    );
  }
}

async function normalizeJobGroup(value) {
  await ensureWageGroups();
  const raw = String(value ?? "").trim();
  const groupNumber = Number(raw);
  if (!Number.isInteger(groupNumber) || groupNumber < 1 || groupNumber > 20) {
    return { ok: false, error: "گروه مزدی را از ۱ تا ۲۰ انتخاب کنید." };
  }
  const result = await pool.query(
    `SELECT group_number FROM wage_groups WHERE group_number=$1 AND year=1405 LIMIT 1`,
    [groupNumber]
  );
  if (!result.rowCount) return { ok: false, error: "گروه مزدی انتخاب‌شده معتبر نیست." };
  return { ok: true, value: String(groupNumber) };
}

async function assertEmailAvailable(email, employeeId = null) {
  if (email === undefined) return { ok: false, error: "فرمت ایمیل صحیح نیست." };
  if (email === null) return { ok: true };
  const query = employeeId === null
    ? `SELECT id FROM personnel WHERE LOWER(email)=LOWER($1) LIMIT 1`
    : `SELECT id FROM personnel WHERE LOWER(email)=LOWER($1) AND id<>$2 LIMIT 1`;
  const params = employeeId === null ? [email] : [email, employeeId];
  const duplicate = await pool.query(query, params);
  if (duplicate.rowCount > 0) return { ok: false, error: "این ایمیل قبلاً برای پرسنل دیگری ثبت شده است." };
  return { ok: true };
}

function cleanNationalId(value) {
  return String(value || "").replace(/[^0-9]/g, "");
}

function cleanChildrenCount(value) {
  const n = Number(value ?? 0);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

async function companyExists(companyId) {
  const result = await pool.query("SELECT id FROM companies WHERE id=$1", [companyId]);
  return result.rowCount > 0;
}

const personnelSelect = `
  SELECT p.id, p.full_name, p.national_id, p.personnel_code, p.email,
    p.mobile, p.marital_status, p.children_count, p.hire_date,
    p.last_order_number, p.last_order_date, p.department, p.job_title,
    p.bank_account, p.bank_iban, p.bank_name, p.job_group, p.company_id,
    p.is_active, p.created_at,
    CASE WHEN p.payslip_password IS NULL OR p.payslip_password='' THEN false ELSE true END AS has_payslip_password,
    c.name AS company_name
  FROM personnel p
  LEFT JOIN companies c ON c.id=p.company_id
`;

export async function GET(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  try {
    await ensurePersonnelColumns();
    const { searchParams } = new URL(request.url);
    const companyIdParam = searchParams.get("company_id");
    let result;
    if (companyIdParam !== null) {
      const companyId = Number(companyIdParam);
      if (!Number.isInteger(companyId) || companyId <= 0) return Response.json({ success: false, error: "شناسه شرکت نامعتبر است." }, { status: 400 });
      if (!(await companyExists(companyId))) return Response.json({ success: false, error: "شرکت انتخاب‌شده پیدا نشد." }, { status: 404 });
      result = await pool.query(`${personnelSelect} WHERE p.company_id=$1 ORDER BY p.id DESC`, [companyId]);
    } else {
      result = await pool.query(`${personnelSelect} ORDER BY p.id DESC`);
    }
    return Response.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Personnel GET error:", error);
    return Response.json({ success: false, error: "خطا در دریافت کارکنان" }, { status: 500 });
  }
}

export async function POST(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  try {
    await ensurePersonnelColumns();
    const body = await request.json();
    const companyId = Number(body.company_id);
    const fullName = String(body.full_name || "").trim();
    const nationalId = cleanNationalId(body.national_id);
    const personnelCode = String(body.personnel_code || "").trim();
    if (!Number.isInteger(companyId) || companyId <= 0) return Response.json({ success: false, error: "لطفاً شرکت را انتخاب کنید." }, { status: 400 });
    if (!fullName) return Response.json({ success: false, error: "نام و نام خانوادگی الزامی است." }, { status: 400 });
    if (nationalId.length !== 10) return Response.json({ success: false, error: "کد ملی باید ۱۰ رقم باشد." }, { status: 400 });
    if (!personnelCode) return Response.json({ success: false, error: "کد پرسنلی الزامی است." }, { status: 400 });
    if (!(await companyExists(companyId))) return Response.json({ success: false, error: "شرکت انتخاب‌شده پیدا نشد." }, { status: 400 });
    const jobGroup = await normalizeJobGroup(body.job_group);
    if (!jobGroup.ok) return Response.json({ success: false, error: jobGroup.error }, { status: 400 });
    const email = normalizeEmail(body.email);
    const emailCheck = await assertEmailAvailable(email);
    if (!emailCheck.ok) return Response.json({ success: false, error: emailCheck.error }, { status: 400 });
    const password = String(body.payslip_password || "").trim();
    const passwordHash = password ? await hashPassword(password) : null;
    const result = await pool.query(`
      INSERT INTO personnel (
        company_id, full_name, national_id, personnel_code, email, mobile,
        marital_status, children_count, hire_date, last_order_number, last_order_date,
        department, job_title, bank_account, bank_iban, bank_name, job_group,
        payslip_password, is_active
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      RETURNING id, full_name, national_id, personnel_code, email, mobile,
        marital_status, children_count, hire_date, last_order_number, last_order_date,
        department, job_title, bank_account, bank_iban, bank_name, job_group,
        company_id, is_active, created_at,
        CASE WHEN payslip_password IS NULL OR payslip_password='' THEN false ELSE true END AS has_payslip_password
    `, [
      companyId, fullName, nationalId, personnelCode, email,
      body.mobile?.trim() || null, body.marital_status?.trim() || null,
      cleanChildrenCount(body.children_count), body.hire_date?.trim() || null,
      body.last_order_number?.trim() || null, body.last_order_date?.trim() || null,
      body.department?.trim() || null, body.job_title?.trim() || null,
      body.bank_account?.trim() || null, body.bank_iban?.trim().toUpperCase() || null,
      body.bank_name?.trim() || null, jobGroup.value, passwordHash,
      body.is_active !== false
    ]);
    return Response.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Personnel POST error:", error);
    return Response.json({ success: false, error: "خطا در ثبت کارمند" }, { status: 500 });
  }
}

export async function PUT(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  try {
    await ensurePersonnelColumns();
    const body = await request.json();
    const id = Number(body.id);
    const companyId = Number(body.company_id);
    if (!Number.isInteger(id) || id <= 0) return Response.json({ success: false, error: "شناسه کارمند نامعتبر است." }, { status: 400 });
    if (!Number.isInteger(companyId) || companyId <= 0) return Response.json({ success: false, error: "لطفاً شرکت را انتخاب کنید." }, { status: 400 });
    if (!(await companyExists(companyId))) return Response.json({ success: false, error: "شرکت انتخاب‌شده پیدا نشد." }, { status: 400 });
    const existing = await pool.query("SELECT id, company_id, payslip_password, email FROM personnel WHERE id=$1", [id]);
    if (!existing.rowCount) return Response.json({ success: false, error: "کارمند پیدا نشد." }, { status: 404 });
    const existingCompanyId = Number(existing.rows[0].company_id);
    if (existingCompanyId !== companyId) {
      const payslips = await pool.query("SELECT COUNT(*)::int AS count FROM payslips WHERE personnel_id=$1", [id]);
      if (Number(payslips.rows[0]?.count || 0) > 0) return Response.json({ success: false, error: "کارمندی که سابقه فیش حقوقی دارد قابل انتقال به شرکت دیگر نیست." }, { status: 409 });
    }
    const nationalId = cleanNationalId(body.national_id);
    if (nationalId.length !== 10) return Response.json({ success: false, error: "کد ملی باید ۱۰ رقم باشد." }, { status: 400 });
    const personnelCode = String(body.personnel_code || "").trim();
    if (!String(body.full_name || "").trim()) return Response.json({ success: false, error: "نام و نام خانوادگی الزامی است." }, { status: 400 });
    if (!personnelCode) return Response.json({ success: false, error: "کد پرسنلی الزامی است." }, { status: 400 });
    const jobGroup = await normalizeJobGroup(body.job_group);
    if (!jobGroup.ok) return Response.json({ success: false, error: jobGroup.error }, { status: 400 });
    const suppliedEmail = Object.prototype.hasOwnProperty.call(body, "email") ? normalizeEmail(body.email) : existing.rows[0].email;
    const emailCheck = await assertEmailAvailable(suppliedEmail, id);
    if (!emailCheck.ok) return Response.json({ success: false, error: emailCheck.error }, { status: 400 });
    const suppliedPassword = String(body.payslip_password || "").trim();
    const passwordHash = suppliedPassword ? await hashPassword(suppliedPassword) : existing.rows[0].payslip_password;
    const result = await pool.query(`
      UPDATE personnel SET
        company_id=$1, full_name=$2, national_id=$3, personnel_code=$4, email=$5, mobile=$6,
        marital_status=$7, children_count=$8, hire_date=$9, last_order_number=$10, last_order_date=$11,
        department=$12, job_title=$13, bank_account=$14, bank_iban=$15, bank_name=$16,
        job_group=$17, payslip_password=$18, is_active=$19
      WHERE id=$20
      RETURNING id, full_name, national_id, personnel_code, email, mobile, marital_status,
        children_count, hire_date, last_order_number, last_order_date, department, job_title,
        bank_account, bank_iban, bank_name, job_group, company_id, is_active, created_at,
        CASE WHEN payslip_password IS NULL OR payslip_password='' THEN false ELSE true END AS has_payslip_password
    `, [
      companyId, String(body.full_name || "").trim(), nationalId, personnelCode, suppliedEmail,
      body.mobile?.trim() || null, body.marital_status?.trim() || null,
      cleanChildrenCount(body.children_count), body.hire_date?.trim() || null,
      body.last_order_number?.trim() || null, body.last_order_date?.trim() || null,
      body.department?.trim() || null, body.job_title?.trim() || null,
      body.bank_account?.trim() || null, body.bank_iban?.trim().toUpperCase() || null,
      body.bank_name?.trim() || null, jobGroup.value, passwordHash, body.is_active !== false, id
    ]);
    return Response.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Personnel PUT error:", error);
    return Response.json({ success: false, error: "خطا در ویرایش کارمند" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  let client;
  try {
    const body = await request.json();
    const id = Number(body.id);
    const requestedCompanyId = body.company_id === undefined || body.company_id === null || body.company_id === "" ? null : Number(body.company_id);
    if (!Number.isInteger(id) || id <= 0) return Response.json({ success: false, error: "شناسه کارمند نامعتبر است." }, { status: 400 });
    if (requestedCompanyId !== null && (!Number.isInteger(requestedCompanyId) || requestedCompanyId <= 0)) return Response.json({ success: false, error: "شناسه شرکت نامعتبر است." }, { status: 400 });
    client = await pool.connect();
    await client.query("BEGIN");
    const employee = await client.query("SELECT id, full_name, company_id FROM personnel WHERE id=$1 FOR UPDATE", [id]);
    if (!employee.rowCount) { await client.query("ROLLBACK"); return Response.json({ success: false, error: "کارمند پیدا نشد." }, { status: 404 }); }
    if (requestedCompanyId !== null && Number(employee.rows[0].company_id) !== requestedCompanyId) { await client.query("ROLLBACK"); return Response.json({ success: false, error: "این کارمند متعلق به شرکت انتخاب‌شده نیست." }, { status: 409 }); }
    await client.query("DELETE FROM payslips WHERE personnel_id=$1", [id]);
    const result = await client.query("DELETE FROM personnel WHERE id=$1 RETURNING id", [id]);
    if (!result.rowCount) { await client.query("ROLLBACK"); return Response.json({ success: false, error: "کارمند پیدا نشد." }, { status: 404 }); }
    await client.query("COMMIT");
    return Response.json({ success: true, deletedEmployeeId: result.rows[0].id, message: `کارمند ${employee.rows[0].full_name} و تمام فیش‌های وابسته با موفقیت حذف شد.` });
  } catch (error) {
    if (client) { try { await client.query("ROLLBACK"); } catch {} }
    console.error("Personnel DELETE error:", error);
    return Response.json({ success: false, error: "حذف کامل کارمند انجام نشد. سوابق وابسته حفظ شدند." }, { status: 500 });
  } finally { client?.release(); }
}
