import assert from "node:assert/strict";
import fs from "node:fs";

const shell = fs.readFileSync("app/payslip/EmployeeAuthenticatedShell.js", "utf8");
const banner = fs.readFileSync("app/payslip/CompanyWelcomeBanner.js", "utf8");
const nav = fs.readFileSync("app/payslip/EmployeeBottomNav.js", "utf8");
const dashboard = fs.readFileSync("app/payslip/EmployeeDashboardHome.js", "utf8");

assert.match(shell, /if \(!checked\) return null;/, "auth check must block the login/dashboard overlap while session state is being resolved");
assert.match(shell, /<CompanyWelcomeBanner employee=\{employee\} \/>/, "shell must pass the authenticated employee to the welcome banner");
assert.match(shell, /<EmployeeDashboardHome payslipCount=\{months\.length\} \/>/, "shell must pass session data to the dashboard");
assert.doesNotMatch(banner, /body: JSON\.stringify\(\{\}\)/, "welcome banner must not perform a second session probe");
assert.doesNotMatch(nav, /body: JSON\.stringify\(\{\}\)/, "bottom navigation must not perform a second session probe");
assert.doesNotMatch(dashboard, /body: JSON\.stringify\(\{\}\)/, "dashboard must not perform a third session probe");
assert.match(dashboard, /function EmployeeDashboardHome\(\{ employee, payslipCount \}\)/, "dashboard must consume session data from the shell");

console.log("employee auth shell regression: PASS");
