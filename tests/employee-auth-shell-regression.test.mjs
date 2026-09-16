import assert from "node:assert/strict";
import fs from "node:fs";

const shell = fs.readFileSync("app/payslip/EmployeeAuthenticatedShell.js", "utf8");
const page = fs.readFileSync("app/payslip/page.js", "utf8");

const rootGuardIndex = shell.indexOf('if (normalizedPathname === "/payslip") return children;');
const authChromeIndex = shell.indexOf("function AuthenticatedEmployeeChrome");
assert.ok(rootGuardIndex >= 0, "root employee route must have an explicit login-only guard");
assert.ok(authChromeIndex >= 0, "authenticated employee chrome must be isolated from the root login page");
assert.ok(rootGuardIndex < authChromeIndex, "root login guard must run before authenticated employee chrome is mounted");
assert.doesNotMatch(page, /setMode\("dashboard"\)/, "first page must not switch into an authenticated dashboard");
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
