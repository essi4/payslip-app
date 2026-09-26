import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const adminPage = fs.readFileSync(new URL("../app/admin/payslips/page.js", import.meta.url), "utf8");
const api = fs.readFileSync(new URL("../app/api/payslips/route.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../app/admin/payslips/payslips.css", import.meta.url), "utf8");

test("admin payslip list is compact and employee-card based", () => {
  assert.match(adminPage, /payslip-list-grid/);
  assert.match(adminPage, /payslip-card/);
  assert.match(adminPage, /payslip-card-name/);
  assert.match(adminPage, /حقوق پایه/);
  assert.match(adminPage, /بیمه/);
  assert.match(adminPage, /مالیات/);
  assert.match(adminPage, /خالص/);
  assert.doesNotMatch(adminPage, /<th>حقوق پایه<\/th>/);
  assert.doesNotMatch(adminPage, /<th>بیمه<\/th>/);
  assert.doesNotMatch(adminPage, /<th>مالیات<\/th>/);
  assert.match(adminPage, /paymentMonth\(p\.month\)/);
  assert.match(adminPage, /formatYear\(p\.year\)/);
});

test("admin payslip list supports search, year, month, group and period status filters", () => {
  assert.match(adminPage, /listFilters\.q/);
  assert.match(adminPage, /listFilters\.year/);
  assert.match(adminPage, /listFilters\.month/);
  assert.match(adminPage, /listFilters\.jobGroup/);
  assert.match(adminPage, /listFilters\.status/);
  assert.match(adminPage, /payslipParams\.set\("q"/);
  assert.match(adminPage, /payslipParams\.set\("year"/);
  assert.match(adminPage, /payslipParams\.set\("month"/);
  assert.match(adminPage, /payslipParams\.set\("job_group"/);
  assert.match(adminPage, /payslipParams\.set\("status"/);
});

test("admin payslip list uses server pagination and loads full detail only for editing", () => {
  assert.match(adminPage, /const PAGE_SIZE = 20/);
  assert.match(adminPage, /page_size: String\(PAGE_SIZE\)/);
  assert.match(adminPage, /payslipMeta\.total_pages/);
  assert.match(adminPage, /\/api\/payslips\/\$\{encodeURIComponent\(payslip\.id\)\}/);
  assert.match(api, /LIMIT \$\{limitIndex\} OFFSET \$\{offsetIndex\}/);
  assert.match(api, /COUNT\(\*\)::int AS total/);
  assert.match(api, /const total = Number\(countResult\.rows\[0\]\?\.total \|\| 0\)/);
  assert.match(api, /const total = Number\(countResult\.rows\[0\]\?\.total \|\| 0\)[\s\S]*const totalPages =/);
  assert.match(api, /page: safePage/);
  assert.match(api, /p\.base_salary,p\.insurance,p\.tax,p\.net_salary/);
  assert.match(api, /total_pages/);
});

test("admin payslip list has responsive filter and pagination styles", () => {
  assert.match(css, /\.payslip-filter-grid/);
  assert.match(css, /\.payslip-pagination/);
  assert.match(css, /@media \(max-width:700px\)/);
});

test("admin payslip cards remain responsive", () => {
  assert.match(css, /\.payslip-list-grid/);
  assert.match(css, /\.payslip-card/);
  assert.match(css, /grid-template-columns:1fr 1fr/);
});
