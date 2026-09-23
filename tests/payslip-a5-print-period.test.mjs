import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const pagePath = new URL("../app/payslip/slips/page.js", import.meta.url);
const page = fs.readFileSync(pagePath, "utf8");

test("employee payslip shows the payment period from real payslip data", () => {
  assert.match(page, /const payYear = Number\(p\.year\)/);
  assert.match(page, /const payMonth = jalaliMonths\[payMonthNumber - 1\]/);
  assert.match(page, /const payPeriodNumber = Number\(p\.period \?\? p\.pay_period \?\? p\.month\)/);
  assert.match(page, /سال پرداخت/);
  assert.match(page, /ماه پرداخت/);
  assert.match(page, /دوره حقوق/);
  assert.match(page, /\{payYear\}/);
  assert.match(page, /\{payMonth\}/);
  assert.match(page, /دوره \{payPeriod\}/);
});

test("payslip print layout is explicitly A5 portrait", () => {
  assert.match(page, /@page \{ size: A5 portrait; margin: 8mm; \}/);
  assert.match(page, /width:148mm/);
  assert.match(page, /min-width:148mm/);
  assert.match(page, /\.payslip-print-sheet/);
  assert.match(page, /\.pay-period-box/);
});
