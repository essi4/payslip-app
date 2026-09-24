import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const pagePath = new URL("../app/payslip/slips/page.js", import.meta.url);
const page = fs.readFileSync(pagePath, "utf8");

test("employee payslip shows the payment period from real payslip data", () => {
  assert.match(page, /const payYear = Number\(p\.year\)/);
  assert.match(page, /const payMonth = jalaliMonths\[payMonthNumber - 1\]/);
  assert.match(page, /سال پرداخت/);
  assert.match(page, /ماه پرداخت/);
  assert.match(page, /\{payMonth\}/);
  assert.match(page, /<span className="period-label">ماه پرداخت<\/span>/);
  assert.match(page, /<strong>\{payMonth\}<\/strong>/);
  assert.doesNotMatch(page, /دوره حقوق/);
});

test("payslip print layout is explicitly A5 portrait", () => {
  assert.match(page, /@page \{ size: A5 portrait; margin: 8mm; \}/);
  assert.match(page, /\.payslip-print-sheet/);
  assert.match(page, /\.payslip-print-sheet \{ width:100%;/);
  assert.match(page, /max-width:none !important/);
  assert.match(page, /html, body \{ width:100%; min-width:0;/);
  assert.match(page, /\.pay-period-box/);
});

test("payslip uses ungrouped Persian digits for year and grouped formatting only for money", () => {
  assert.match(page, /const persianDigits = "۰۱۲۳۴۵۶۷۸۹"/);
  assert.match(page, /return String\(value \?\? ""\)\.replace\(\/\[0-9\]\/g/);
  assert.match(page, /function formatMoney\(value\)/);
  assert.match(page, /new Intl\.NumberFormat\("fa-IR"\)/);
  assert.match(page, /function formatYear\(value\)/);
  assert.match(page, /formatYear\(p\.year\)/);
  assert.doesNotMatch(page, /payYearNumber\)\.toLocaleString\("fa-IR"\)/);
});
