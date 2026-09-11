import { NextResponse } from "next/server";
import { clearEmployeeSession, getEmployeeSession } from "../../../lib/employee-auth";
import { logSecurityEvent } from "../../../lib/security-log";

export async function POST(request) {
  const session = getEmployeeSession(request);
  await logSecurityEvent({ employeeId: session?.employeeId || null, event: "employee_logout", request });
  const response = NextResponse.json({ success: true });
  clearEmployeeSession(response);
  return response;
}

export async function GET() {
  return NextResponse.json({ success: false, error: "روش درخواست نامعتبر است." }, { status: 405, headers: { Allow: "POST" } });
}
