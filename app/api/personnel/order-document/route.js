import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import { requireAdmin } from "../../../lib/admin-auth";
import { getEmployeeSession } from "../../../lib/employee-auth";

export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

async function ensureColumns() {
  await pool.query(`
    ALTER TABLE personnel
      ADD COLUMN IF NOT EXISTS order_document_data TEXT,
      ADD COLUMN IF NOT EXISTS order_document_mime TEXT,
      ADD COLUMN IF NOT EXISTS order_document_name TEXT,
      ADD COLUMN IF NOT EXISTS order_document_size INTEGER
  `);
}

function cleanId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    await ensureColumns();
    const form = await request.formData();
    const personnelId = cleanId(form.get("personnel_id"));
    const file = form.get("document");

    if (!personnelId) return NextResponse.json({ success: false, error: "پرسنل انتخاب نشده است." }, { status: 400 });
    if (!file || typeof file.arrayBuffer !== "function") return NextResponse.json({ success: false, error: "فایل حکم را انتخاب کنید." }, { status: 400 });
    if (!ALLOWED.has(file.type)) return NextResponse.json({ success: false, error: "فقط PDF یا تصویر JPG، PNG و WEBP مجاز است." }, { status: 400 });
    if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ success: false, error: "حجم فایل باید حداکثر ۸ مگابایت باشد." }, { status: 400 });

    const employee = await pool.query("SELECT id, full_name FROM personnel WHERE id=$1 LIMIT 1", [personnelId]);
    if (!employee.rowCount) return NextResponse.json({ success: false, error: "پرسنل پیدا نشد." }, { status: 404 });

    const bytes = Buffer.from(await file.arrayBuffer());
    const data = bytes.toString("base64");
    await pool.query(
      `UPDATE personnel
       SET order_document_data=$1, order_document_mime=$2, order_document_name=$3, order_document_size=$4
       WHERE id=$5`,
      [data, file.type, String(file.name || "حکم کارگزینی"), Number(file.size), personnelId]
    );

    return NextResponse.json({ success: true, data: { personnel_id: personnelId, full_name: employee.rows[0].full_name, file_name: file.name, mime: file.type, size: file.size } });
  } catch (error) {
    console.error("ORDER DOCUMENT POST ERROR:", error);
    return NextResponse.json({ success: false, error: "خطا در ذخیره حکم کارگزینی." }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await ensureColumns();
    const session = getEmployeeSession(request);
    if (!session) return NextResponse.json({ success: false, error: "نشست پرسنلی معتبر نیست." }, { status: 401 });

    const result = await pool.query(
      `SELECT full_name, order_document_data, order_document_mime, order_document_name, order_document_size
       FROM personnel WHERE id=$1 LIMIT 1`,
      [session.employeeId]
    );
    if (!result.rowCount) return NextResponse.json({ success: false, error: "پرسنل پیدا نشد." }, { status: 404 });

    const row = result.rows[0];
    if (!row.order_document_data) return NextResponse.json({ success: true, document: null });
    return NextResponse.json({
      success: true,
      document: {
        name: row.order_document_name || "حکم کارگزینی",
        mime: row.order_document_mime || "application/pdf",
        size: Number(row.order_document_size || 0),
        data: `data:${row.order_document_mime || "application/pdf"};base64,${row.order_document_data}`,
      },
    });
  } catch (error) {
    console.error("ORDER DOCUMENT GET ERROR:", error);
    return NextResponse.json({ success: false, error: "خطا در دریافت حکم کارگزینی." }, { status: 500 });
  }
}

export async function DELETE(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  try {
    await ensureColumns();
    const body = await request.json().catch(() => ({}));
    const personnelId = cleanId(body.personnel_id);
    if (!personnelId) return NextResponse.json({ success: false, error: "پرسنل انتخاب نشده است." }, { status: 400 });
    const result = await pool.query(
      `UPDATE personnel SET order_document_data=NULL, order_document_mime=NULL, order_document_name=NULL, order_document_size=NULL
       WHERE id=$1 RETURNING id`,
      [personnelId]
    );
    if (!result.rowCount) return NextResponse.json({ success: false, error: "پرسنل پیدا نشد." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ORDER DOCUMENT DELETE ERROR:", error);
    return NextResponse.json({ success: false, error: "حذف حکم انجام نشد." }, { status: 500 });
  }
}
