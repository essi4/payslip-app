import { NextResponse } from "next/server";
import pool from "../../lib/db.js";
import { requireAdmin } from "../../lib/admin-auth.js";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 100), 1), 500);
    const { rows } = await pool.query(
      `SELECT id, action, entity_type, entity_id, payroll_period_id, details, created_at
       FROM audit_logs ORDER BY created_at DESC, id DESC LIMIT $1`,
      [limit]
    );
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("GET audit logs error:", error);
    return NextResponse.json({ success: false, error: "خطا در دریافت لاگ تغییرات" }, { status: 500 });
  }
}
