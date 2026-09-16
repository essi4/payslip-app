import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

async function read(path) {
  return fs.readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("authenticated dashboard keeps the three services as cards and sends payslips to their own page", async () => {
  const dashboard = await read("app/payslip/EmployeeDashboardHome.js");
  assert.match(dashboard, /فیش حقوقی/);
  assert.match(dashboard, /حکم کارگزینی/);
  assert.match(dashboard, /مشخصات من/);
  assert.match(dashboard, /\/payslip\/slips/);
  assert.doesNotMatch(dashboard, /آخرین وضعیت/);
  assert.doesNotMatch(dashboard, /همه سال‌ها/);
  assert.doesNotMatch(dashboard, /فیشی برای این انتخاب پیدا نشد/);
});

test("authenticated shell renders only the authenticated dashboard after session validation", async () => {
  const shell = await read("app/payslip/EmployeeAuthenticatedShell.js");
  assert.match(shell, /EmployeeDashboardHome/);
  assert.match(shell, /<EmployeeDashboardHome/);
  assert.match(shell, /if\s*\(!checked\)/);
});
