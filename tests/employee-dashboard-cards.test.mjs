import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

async function read(path) {
  return fs.readFile(new URL(\`../\${path}\`, import.meta.url), "utf8");
}

test("employee dashboard keeps the approved three-card personnel layout", async () => {
  const dashboard = await read("app/payslip/dashboard/page.js");

  assert.match(dashboard, /داشبورد کارمند/);
  assert.match(dashboard, /فیش‌های حقوقی من/);
  assert.match(dashboard, /حکم کارگزینی/);
  assert.match(dashboard, /حساب من/);
  assert.match(dashboard, /\/payslip\/slips/);
  assert.match(dashboard, /\/payslip\/order/);
  assert.match(dashboard, /\/payslip\/account/);
  assert.doesNotMatch(dashboard, /شماره موبایل<\/h2>/);
  assert.doesNotMatch(dashboard, /📄|📋|📱|👤/);
});

test("employee navigation is a four-item icon-based bottom dock", async () => {
  const nav = await read("app/payslip/EmployeeBottomNav.js");
  const shell = await read("app/payslip/EmployeeAuthenticatedShell.js");

  assert.match(nav, /lucide-react/);
  assert.match(nav, /خانه/);
  assert.match(nav, /فیش‌ها/);
  assert.match(nav, /حکم/);
  assert.match(nav, /حساب من/);
  assert.match(nav, /grid-cols-4/);
  assert.match(nav, /aria-current/);
  assert.doesNotMatch(nav, /📄|📝|👤/);
  assert.match(shell, /EmployeeBottomNav/);
});

test("payslip card keeps live year/month selection and the complete payslip breakdown", async () => {
  const dashboard = await read("app/payslip/dashboard/page.js");
  const breakdown = await read("app/lib/payslip-breakdown.js");

  assert.match(dashboard, /selectedPayslip/);
  assert.match(dashboard, /selectedYear/);
  assert.match(dashboard, /selectedMonth/);
  assert.match(breakdown, /base_salary/);
  assert.match(breakdown, /insurance/);
  assert.match(breakdown, /tax/);
  assert.match(breakdown, /net_salary/);
});

test("employee payslip page uses the shared visual system without emoji icons", async () => {
  const slips = await read("app/payslip/slips/page.js");

  assert.match(slips, /فیش حقوق و دستمزد/);
  assert.match(slips, /پرداختی‌ها و مزایا/);
  assert.match(slips, /کسورات/);
  assert.match(slips, /جمع کل پرداختی‌ها/);
  assert.match(slips, /جمع کل کسورات/);
  assert.match(slips, /خالص پرداختی/);
  assert.match(slips, /چاپ فیش/);
  assert.match(slips, /lucide-react/);
  assert.match(slips, /getPayslipYears/);
  assert.match(slips, /getAvailablePayslipMonths/);
  assert.doesNotMatch(slips, /🖨|📄|👤|🪪|💼|🏷️|🏢|📅|🚗|💳/);
});
