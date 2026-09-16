import assert from "node:assert/strict";
import fs from "node:fs";

const shell = fs.readFileSync("app/payslip/EmployeeAuthenticatedShell.js", "utf8");
const page = fs.readFileSync("app/payslip/page.js", "utf8");

assert.match(shell, /return children;/, "root employee route must be able to return the login page");
assert.doesNotMatch(page, /setMode/, "first page must not switch into an authenticated dashboard");
assert.doesNotMatch(page, /SimpleCard/, "first page must not contain dashboard cards");
assert.doesNotMatch(page, /PayslipDocument/, "first page must not contain payslip document UI");
assert.match(page, /سامانه کارکنان/);
assert.match(page, /سیستم حقوق و دستمزد/);
assert.match(page, /فیش حقوقی و خدمات پرسنلی/);
assert.match(page, /ورود به حساب کاربری/);
assert.match(page, /کد ملی/);
assert.match(page, /رمز عبور/);
assert.match(page, /ورود به پنل پرسنلی/);
assert.match(page, /فراموشی رمز عبور/);

console.log("employee first page regression: PASS");
