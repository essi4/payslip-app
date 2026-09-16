import assert from "node:assert/strict";
import fs from "node:fs";

const personnelRoute = fs.readFileSync("app/api/personnel/route.js", "utf8");
const payslipsRoute = fs.readFileSync("app/api/payslips/route.js", "utf8");
const bulkRoute = fs.readFileSync("app/api/payslips/bulk/route.js", "utf8");
const employeesPage = fs.readFileSync("app/admin/employees/page.js", "utf8");

assert.match(personnelRoute, /national_id/);
assert.match(personnelRoute, /company_id/);

assert.match(payslipsRoute, /employee\.job_group/);
assert.match(payslipsRoute, /employee\.company_id/);
assert.match(payslipsRoute, /existing\.period_company_id/);
assert.match(payslipsRoute, /انتقال فیش بین شرکت‌ها مجاز نیست/);
assert.match(payslipsRoute, /job_group:\s*employee\.job_group/);
assert.match(payslipsRoute, /job_title:\s*employee\.job_title/);
assert.match(payslipsRoute, /bank_account:\s*employee\.bank_account/);

assert.match(bulkRoute, /WHERE company_id=\$1 AND id = ANY\(\$2::int\[\]\)/);
assert.match(bulkRoute, /const groupNumber = Number\(employee\.job_group\)/);

assert.match(employeesPage, /شرکت پرسنل/);
assert.match(employeesPage, /activeCompany\?\.name/);
assert.doesNotMatch(employeesPage, /field\("شرکت","companyId"/);
assert.match(employeesPage, /company_id:Number\(activeCompanyId\)/);

console.log("company ↔ personnel ↔ payslip linkage regression: PASS");
