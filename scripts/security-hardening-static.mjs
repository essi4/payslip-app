import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
let passed = 0;
let failed = 0;

function check(name, condition, details = "") {
  if (condition) {
    passed += 1;
    console.log(`PASS | ${name}${details ? ` | ${details}` : ""}`);
  } else {
    failed += 1;
    console.log(`FAIL | ${name}${details ? ` | ${details}` : ""}`);
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const packageJson = JSON.parse(read("package.json"));
const packageLock = JSON.parse(read("package-lock.json"));
const adminLogin = read("app/api/auth/login/route.js");
const secureRecovery = read("app/api/payslip/reset-password/route.js");

const xlsxSpec = packageJson.dependencies?.xlsx || "";
const lockedXlsx = packageLock.packages?.["node_modules/xlsx"] || {};
check(
  "XLSX | patched official SheetJS artifact",
  xlsxSpec === "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz" &&
    lockedXlsx.version === "0.20.3" &&
    lockedXlsx.resolved === xlsxSpec &&
    lockedXlsx.integrity === "sha512-oLDq3jw7AcLqKWH2AhCpVTZl8mf6X2YReP+Neh0SJUzV/BdZYjth94tG5toiMB1PPrYtxOCfaoUCkvtuH+3AJA==" ||
  false
);
check("XLSX | no vulnerable 0.18.5 root spec", xlsxSpec !== "^0.18.5");
check("Admin login | IP rate limit present", adminLogin.includes('scope: "admin_login_ip"') && adminLogin.includes("checkRateLimit"));
check("Admin login | account rate limit present", adminLogin.includes('scope: "admin_login_account"') && adminLogin.includes("maxAttempts: 5"));
check("Admin login | rate-limit response is 429", adminLogin.includes("status: 429") && adminLogin.includes('"Retry-After"'));
check("Admin login | success clears limits", adminLogin.includes('clearRateLimit({ scope: "admin_login_ip"') && adminLogin.includes('clearRateLimit({ scope: "admin_login_account"'));
check("Recovery | secure reset keeps 8-char minimum", secureRecovery.includes("newPassword.length < 8"));
check("Recovery | recovery code is hashed", secureRecovery.includes("hashRecoveryCode(code)"));

for (const relativePath of [
  "app/api/personnel/request-reset/route.js",
  "app/api/personnel/forgot-password/route.js",
  "app/api/personnel/reset-password/route.js",
]) {
  check(`Legacy reset | ${relativePath} removed`, !fs.existsSync(path.join(root, relativePath)));
}

console.log(`RESULT | passed=${passed} failed=${failed} total=${passed + failed}`);
process.exit(failed === 0 ? 0 : 1);
