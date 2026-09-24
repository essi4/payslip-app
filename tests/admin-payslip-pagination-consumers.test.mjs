import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const files = [
  "app/admin/payslips/print/page.js",
  "app/admin/payslips/final-print/page.js",
  "app/admin/payslips/excel/page.js",
];

test("bulk admin payslip consumers fetch every paginated page", () => {
  for (const relative of files) {
    const content = fs.readFileSync(new URL(`../${relative}`, import.meta.url), "utf8");
    assert.match(content, /page=\\${page}&page_size=50/);
    assert.match(content, /totalPages/);
    assert.match(content, /page <= totalPages/);
  }
});
