import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import { hashPassword, verifyPassword } from "../../../lib/password";
import { getEmployeeSession } from "../../../lib/employee-auth";

export async function POST(request) {
  try {
    const session = getEmployeeSession(request);
    if (!session) return NextResponse.json({ success: false, error: "نشست شما منقضی شده است. دوباره وارد شوید." }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const currentPassword = String(body?.current_password || "");
    const newPassword = String(body?.new_password || "");
    const confirmPassword = String(body?.confirm_password || "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ success: false, error: "همه فیلدهای رمز عبور را کامل کنید." }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, error: "رمز عبور جدید باید حداقل ۸ کاراکتر باشد." }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ success: false, error: "رمز عبور جدید و تکرار آن یکسان نیست." }, { status: 400 });
    }
    if (newPassword === currentPassword) {
      return NextResponse.json({ success: false, error: "رمز عبور جدید باید با رمز فعلی متفاوت باشد." }, { status: 400 });
    }

    const result = await pool.query("SELECT payslip_password FROM personnel WHERE id=$1 LIMIT 1", [session.employeeId]);
    if (!result.rows.length) return NextResponse.json({ success: false, error: "حساب کاربری پیدا نشد." }, { status: 404 });

    const check = await verifyPassword(currentPassword, result.rows[0].payslip_password);
    if (!check.valid) return NextResponse.json({ success: false, error: "رمز عبور فعلی صحیح نیست." }, { status: 400 });

    const passwordHash = await hashPassword(newPassword);
    await pool.query("UPDATE personnel SET payslip_password=$1 WHERE id=$2", [passwordHash, session.employeeId]);

    const response = NextResponse.json({ success: true, message: "رمز عبور با موفقیت تغییر کرد. برای امنیت بیشتر دوباره وارد شوید." });
    response.cookies.set("employee_session", "", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(0) });
    return response;
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    return NextResponse.json({ success: false, error: "تغییر رمز عبور انجام نشد. دوباره تلاش کنید." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ success: false, error: "روش درخواست نامعتبر است." }, { status: 405, headers: { Allow: "POST" } });
}
