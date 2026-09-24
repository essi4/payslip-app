import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const reportsPage = fs.readFileSync(new URL("../app/admin/reports/page.js", import.meta.url), "utf8");
const reportsApi = fs.readFileSync(new URL("../app/api/reports/route.js", import.meta.url), "utf8");
const correctionsPage = fs.readFileSync(new URL("../app/admin/corrections/page.js", import.meta.url), "utf8");
const correctionsApi = fs.readFileSync(new URL("../app/api/corrections/route.js", import.meta.url), "utf8");

test("reports and corrections month filters use numeric storage values", () => {
  assert.match(reportsPage, /value=\{String\(index \+ 1\)\}/);
  assert.match(reportsApi, /normalizePayslipMonth/);
  assert.match(reportsApi, /addCondition\("p\.month = \?", monthNumber\)/);
  assert.match(correctionsPage, /value=\{String\(index \+ 1\)\}/);
  assert.match(correctionsApi, /const monthNumber = monthRaw \? normalizeMonth\(monthRaw\) : null/);
  assert.match(correctionsApi, /p\.month=\$\{index\}/);
});
