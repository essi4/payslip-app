import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const dashboard = fs.readFileSync("app/payslip/dashboard/page.js", "utf8");
const shell = fs.readFileSync("app/payslip/EmployeeAuthenticatedShell.js", "utf8");

test("employee dashboard renders exactly one shared set of three service cards", () => {
  assert.match(dashboard, /import \{ EMPLOYEE_PANEL_CARDS \} from "\.\.\/\.\.\/lib\/employee-panel";/);
  assert.equal(
    (dashboard.match(/EMPLOYEE_PANEL_CARDS\.map\(/g) || []).length,
    1,
    "the dashboard must map the shared service cards exactly once",
  );
  assert.doesNotMatch(
    dashboard,
    /EmployeeBottomNav/,
    "the dashboard must not render the legacy bottom navigation",
  );
});

test("employee dashboard does not mount the shared welcome banner twice", () => {
  assert.match(
    dashboard,
    /خوش آمدید، \{employee\?\.full_name/,
    "the dashboard must own the single welcome heading",
  );
  assert.match(
    shell,
    /normalizedPathname === "\/payslip\/dashboard"/,
    "the authenticated shell must identify the dashboard route",
  );
  assert.match(
    shell,
    /showBanner=\{false\}/,
    "the shared welcome banner must be disabled on the dashboard",
  );
});

console.log("employee panel duplicate-card regression: PASS");
