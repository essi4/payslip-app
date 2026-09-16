import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const api = fs.readFileSync(new URL("../app/api/payslip/route.js", import.meta.url), "utf8");
const page = fs.readFileSync(new URL("../app/payslip/page.js", import.meta.url), "utf8");

test("employee payslip API returns company identity for the logged-in employee", () => {
  assert.match(api, /company_id/);
  assert.match(api, /company_name/);
  assert.match(api, /JOIN companies|LEFT JOIN companies/i);
});

test("employee panel greets the logged-in employee and shows their company", () => {
  assert.match(page, /خوش آمدید/);
  assert.match(page, /شرکت/);
  assert.match(page, /employee\.company_name/);
});
