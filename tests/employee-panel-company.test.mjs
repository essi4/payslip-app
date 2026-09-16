import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

async function read(path) {
  return fs.readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("employee payslip API returns the company name for the logged-in employee", async () => {
  const source = await read("app/api/payslip/route.js");
  assert.match(source, /company_id/);
  assert.match(source, /companies/);
  assert.match(source, /company_name/);
});

test("employee panel displays a personalized welcome and company", async () => {
  const source = await read("app/payslip/CompanyWelcomeBanner.js");
  assert.match(source, /خوش آمدید/);
  assert.match(source, /شرکت/);
  assert.match(source, /company_name/);
});

test("payslip layout gates panel chrome behind the authenticated shell", async () => {
  const layout = await read("app/payslip/layout.js");
  const shell = await read("app/payslip/EmployeeAuthenticatedShell.js");
  assert.match(layout, /EmployeeAuthenticatedShell/);
  assert.match(shell, /authenticated/);
  assert.match(shell, /if\s*\(!authenticated\)/);
  assert.match(shell, /CompanyWelcomeBanner/);
  assert.match(shell, /EmployeeBottomNav/);
});
