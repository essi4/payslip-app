import assert from "node:assert/strict";
import fs from "node:fs";

const shell = fs.readFileSync("app/payslip/EmployeeAuthenticatedShell.js", "utf8");

assert.match(shell, /pathname\?\.replace\(\/\\\/+\$\/g, ""\)/, "home-route detection must normalize trailing slashes");
assert.match(shell, /const isHome = normalizedPathname === "\/payslip";/, "normalized /payslip path must render the authenticated dashboard instead of the login child");

console.log("employee auth shell path regression: PASS");
