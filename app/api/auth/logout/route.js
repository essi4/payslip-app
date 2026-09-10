import { NextResponse } from "next/server";
import { clearAdminSession } from "../../../lib/admin-auth";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "خروج با موفقیت انجام شد." });
  clearAdminSession(response);
  return response;
}
