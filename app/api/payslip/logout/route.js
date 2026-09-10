import { NextResponse } from "next/server";
import { clearEmployeeSession } from "../../../lib/employee-auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearEmployeeSession(response);
  return response;
}
