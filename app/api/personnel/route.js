import pool from "../../lib/db";
import { requireAdmin } from "../../lib/admin-auth";

export async function GET(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.full_name,
        p.national_id,
        p.personnel_code,
        p.department,
        p.job_title,
        p.bank_account,
        p.job_group,
        p.company_id,
        p.created_at,
        c.name AS company_name
      FROM personnel p
      LEFT JOIN companies c ON c.id = p.company_id
      ORDER BY p.id DESC
    `);

    return Response.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Personnel GET error:", error);
    return Response.json(
      { success: false, error: error.message || "خطا در دریافت کارکنان" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const {
      company_id,
      full_name,
      national_id,
      personnel_code,
      department,
      job_title,
      bank_account,
      job_group,
      payslip_password,
    } = body;

    if (!company_id) return Response.json({ success: false, error: "لطفاً شرکت را انتخاب کنید." }, { status: 400 });
    if (!full_name?.trim()) return Response.json({ success: false, error: "نام و نام خانوادگی الزامی است." }, { status: 400 });
    if (!national_id?.trim()) return Response.json({ success: false, error: "کد ملی الزامی است." }, { status: 400 });
    if (!personnel_code?.trim()) return Response.json({ success: false, error: "کد پرسنلی الزامی است." }, { status: 400 });

    const companyCheck = await pool.query(
      `SELECT id FROM companies WHERE id = $1`,
      [Number(company_id)]
    );

    if (companyCheck.rowCount === 0) {
      return Response.json({ success: false, error: "شرکت انتخاب‌شده پیدا نشد." }, { status: 400 });
    }

    const result = await pool.query(
      `
      INSERT INTO personnel (
        company_id, full_name, national_id, personnel_code,
        department, job_title, bank_account, job_group, payslip_password
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING
        id, full_name, national_id, personnel_code, department,
        job_title, bank_account, job_group, company_id, created_at
      `,
      [
        Number(company_id),
        full_name.trim(),
        national_id.trim(),
        personnel_code.trim(),
        department?.trim() || null,
        job_title?.trim() || null,
        bank_account?.trim() || null,
        job_group?.trim() || null,
        payslip_password?.trim() || null,
      ]
    );

    return Response.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Personnel POST error:", error);
    return Response.json(
      { success: false, error: error.message || "خطا در ثبت کارمند" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const id = Number(body.id);

    if (!id) return Response.json({ success: false, error: "شناسه کارمند نامعتبر است." }, { status: 400 });

    const {
      company_id,
      full_name,
      national_id,
      personnel_code,
      department,
      job_title,
      bank_account,
      job_group,
      payslip_password,
    } = body;

    if (!company_id) return Response.json({ success: false, error: "لطفاً شرکت را انتخاب کنید." }, { status: 400 });

    const result = await pool.query(
      `
      UPDATE personnel
      SET
        company_id=$1,
        full_name=$2,
        national_id=$3,
        personnel_code=$4,
        department=$5,
        job_title=$6,
        bank_account=$7,
        job_group=$8,
        payslip_password=$9
      WHERE id=$10
      RETURNING
        id, full_name, national_id, personnel_code, department,
        job_title, bank_account, job_group, company_id, created_at
      `,
      [
        Number(company_id),
        full_name?.trim() || null,
        national_id?.trim() || null,
        personnel_code?.trim() || null,
        department?.trim() || null,
        job_title?.trim() || null,
        bank_account?.trim() || null,
        job_group?.trim() || null,
        payslip_password?.trim() || null,
        id,
      ]
    );

    if (result.rowCount === 0) return Response.json({ success: false, error: "کارمند پیدا نشد." }, { status: 404 });

    return Response.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Personnel PUT error:", error);
    return Response.json(
      { success: false, error: error.message || "خطا در ویرایش کارمند" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const id = Number(body.id);

    if (!id) return Response.json({ success: false, error: "شناسه کارمند نامعتبر است." }, { status: 400 });

    const result = await pool.query(
      `DELETE FROM personnel WHERE id=$1 RETURNING id`,
      [id]
    );

    if (result.rowCount === 0) return Response.json({ success: false, error: "کارمند پیدا نشد." }, { status: 404 });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Personnel DELETE error:", error);
    return Response.json(
      { success: false, error: error.message || "خطا در حذف کارمند" },
      { status: 500 }
    );
  }
}
