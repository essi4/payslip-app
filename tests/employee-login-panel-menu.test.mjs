import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const loginPage = fs.readFileSync(new URL("../app/payslip/page.js", import.meta.url), "utf8");
const slipsPage = fs.readFileSync(new URL("../app/payslip/slips/page.js", import.meta.url), "utf8");

test("login page keeps only login and password recovery actions", () => {
  assert.match(loginPage, /کد ملی/);
  assert.match(loginPage, /رمز عبور/);
  assert.match(loginPage, /ورود به پنل پرسنلی/);
  assert.match(loginPage, /فراموشی رمز عبور/);
  assert.doesNotMatch(loginPage, /فیش‌های حقوقی من/);
  assert.doesNotMatch(loginPage, /حکم کارگزینی/);
  assert.doesNotMatch(loginPage, /حساب من/);
});

test("employee panel shows the three requested menu cards after login", () => {
  assert.match(slipsPage, /فیش‌های حقوقی من/);
  assert.match(slipsPage, /حکم کارگزینی/);
  assert.match(slipsPage, /حساب من/);
  assert.match(slipsPage, /href=\"\/payslip\/order\"/);
  assert.match(slipsPage, /href=\"\/payslip\/account\"/);
});
