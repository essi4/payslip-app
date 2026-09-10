import pool from "../../../lib/db";
import { requireAdmin } from "../../../lib/admin-auth";

export async function PUT(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const id = Number(body.id);
    const email = String(body.email || "").trim().toLowerCase();

    if (!Number.isInteger(id) || id <= 0) return Response.json({ success: false, error: "شناسه پرسنل نامعتبر است." }, { status: 400 });
    if (!email) return Response.json({ success: false, error: "ایمیل را وارد کنید." }, { status: 400 });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return Response.json({ success: false, error: "فرمت ایمیل صحیح نیست." }, { status: 400 });

    const duplicate = await pool.query(
      `SELECT id FROM personnel WHERE LOWER(email)=LOWER($1) AND id<>$2 LIMIT 1`,
      [email, id]
    );
    if (duplicate.rowCount > 0) return Response.json({ success: false, error: "این ایمیل قبلاً برای پرسنل دیگری ثبت شده است." }, { status: 409 });

    const result = await pool.query(
      `UPDATE personnel SET email=$1 WHERE id=$2
       RETURNING id, full_name, national_id, personnel_code, email`,
      [email, id]
    );
    if (!result.rowCount) return Response.json({ success: false, error: "پرسنل پیدا نشد." }, { status: 404 });

    return Response.json({ success: true, message: "ایمیل پرسنل با موفقیت ثبت شد.", data: result.rows[0] });
  } catch (error) {
    console.error("PERSONNEL EMAIL PUT ERROR:", error);
    return Response.json({ success: false, error: "خطا در ثبت ایمیل پرسنل." }, { status: 500 });
  }
}
