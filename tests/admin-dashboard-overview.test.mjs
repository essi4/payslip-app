import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const pagePath = new URL("../app/admin/page.js", import.meta.url);
const apiPath = new URL("../app/api/dashboard/route.js", import.meta.url);
const page = fs.readFileSync(pagePath, "utf8");
const api = fs.readFileSync(apiPath, "utf8");

test("admin dashboard keeps the overview focused on four primary KPIs", () => {
  assert.match(page, /title: "شرکت‌ها"/);
  assert.match(page, /title: "کارکنان"/);
  assert.match(page, /title: "فیش‌های حقوقی"/);
  assert.match(page, /title: "خالص پرداختی"/);
  assert.equal((page.match(/title: "وضعیت سامانه"/g) || []).length, 0);
  assert.equal((page.match(/title: "اصلاحات فیش‌ها"/g) || []).length, 0);
});

test("dashboard financial summary stays compact and links detailed reports", () => {
  assert.match(page, /خلاصه مالی/);
  assert.match(page, /فقط برای یک نگاه سریع/);
  assert.match(page, /\/admin\/reports/);
  assert.match(page, /حقوق پایه/);
  assert.match(page, /مزایا/);
  assert.match(page, /کسورات/);
  assert.match(page, /companyFinancials/);
  assert.match(page, /خلاصه مالی و دسترسی سریع بر اساس شرکت/);
  assert.match(page, /دسترسی سریع این شرکت/);
  assert.equal((page.match(/title: "تنظیمات"/g) || []).length, 0);
  assert.equal((page.match(/title: "گزارش‌ها"/g) || []).length, 0);
});

test("dashboard API exposes company-scoped financial summaries", () => {
  assert.match(api, /companyFinancialResult = await pool\.query/);
  assert.match(api, /GROUP BY c\.id, c\.name/);
  assert.match(api, /companyFinancials: companyFinancialResult\.rows\.map/);
  assert.match(api, /total_base_salary/);
  assert.match(api, /total_benefits/);
  assert.match(api, /total_deductions/);
  assert.match(api, /total_net_salary/);
});

test("dashboard API exposes the company count used by the primary KPI", () => {
  assert.match(api, /const companiesResult = await pool\.query\("SELECT COUNT\(\*\)::int AS count FROM companies"\);/);
  assert.match(api, /companiesCount: Number\(companiesResult\.rows\[0\]\?\.count \|\| 0\)/);
});


test("dashboard connection indicator reflects loading, error, and success states", () => {
  assert.match(page, /در حال بررسی اتصال/);
  assert.match(page, /اتصال ناموفق/);
  assert.match(page, /اتصال برقرار است/);
  assert.match(page, /loading \? "bg-amber-400" : error \? "bg-rose-400" : "bg-emerald-400"/);
});

test("dashboard company quick links carry company context", () => {
  assert.match(page, /\/admin\/employees\?company_id=\$\{company\.id\}/);
  assert.match(page, /\/admin\/payslips\?company_id=\$\{company\.id\}/);
  assert.match(page, /\/admin\/reports\?company_id=\$\{company\.id\}/);
});
