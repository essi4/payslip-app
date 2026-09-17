import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

async function read(path) {
  return fs.readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("employee dashboard presents the approved three-card personnel layout with live employee fields", async () => {
  const dashboard = await read("app/payslip/dashboard/page.js");

  assert.match(dashboard, /دسترسی سریع/);
  assert.match(dashboard, /فیش حقوقی/);
  assert.match(dashboard, /فعال/);
  assert.match(dashboard, /آخرین حکم کارگزینی/);
  assert.match(dashboard, /امضا شده/);
  assert.match(dashboard, /شماره موبایل/);
  assert.match(dashboard, /تایید شده/);
  assert.match(dashboard, /employee\?\.mobile/);
  assert.match(dashboard, /employee\?\.personnel_code/);
  assert.match(dashboard, /\/payslip\/slips/);
  assert.match(dashboard, /\/payslip\/order/);
  assert.match(dashboard, /\/payslip\/account/);
});

test("employee session payload includes the mobile number needed by the dashboard", async () => {
  const route = await read("app/api/payslip/route.js");
  assert.match(route, /p\.mobile/);
});
