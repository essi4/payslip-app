import assert from "node:assert/strict";
import fs from "node:fs";

const personnelRoute = fs.readFileSync("app/api/personnel/route.js", "utf8");
const payslipsRoute = fs.readFileSync("app/api/payslips/route.js", "utf8");
const bulkRoute = fs.readFileSync("app/api/payslips/bulk/route.js", "utf8");

assert.match(personnelRoute, /national_id/);
assert.match(personnelRoute, /company_id/);
assert.match(personnelRoute, /این کد ملی قبلاً برای پرسنل دیگری ثبت شده است/);

assert.match(payslipsRoute, /employee\.job_group/);
assert.match(payslipsRoute, /employee\.company_id/);
assert.match(payslipsRoute, /period\.company_id/);
assert.match(payslipsRoute, /انتقال فیش بین شرکت‌ها مجاز نیست/);

assert.match(bulkRoute, /WHERE company_id=\$1 AND id = ANY\(\$2::int\[\]\)/);
assert.match(bulkRoute, /const groupNumber = Number\(employee\.job_group\)/);

console.log("company ↔ personnel ↔ payslip linkage regression: PASS");
