import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const layout = fs.readFileSync(new URL("../app/payslip/layout.js", import.meta.url), "utf8");
const orderPage = fs.readFileSync(new URL("../app/payslip/order/page.js", import.meta.url), "utf8");

test("employee panel exposes payslips and personnel order navigation", () => {
  assert.match(layout, /href=\"\/payslip\"/);
  assert.match(layout, /href=\"\/payslip\/order\"/);
  assert.match(layout, /فیش‌های حقوقی من/);
  assert.match(layout, /حکم کارگزینی/);
});

test("personnel order page is employee-scoped and printable", () => {
  assert.match(orderPage, /fetch\(\"\/api\/payslip\"/);
  assert.match(orderPage, /حکم کارگزینی/);
  assert.match(orderPage, /چاپ حکم/);
});
