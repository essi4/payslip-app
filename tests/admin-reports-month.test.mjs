import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync(new URL("../app/admin/reports/page.js", import.meta.url), "utf8");
const api = fs.readFileSync(new URL("../app/api/reports/route.js", import.meta.url), "utf8");

test("reports page sends numeric month values while showing Persian labels", () => {
  assert.match(
    page,
    /months\.map\(\(item, index\) => \(\s*<option key=\{item\} value=\{String\(index \+ 1\)\}>\{item\}<\/option>/
  );
});

test("reports API accepts Persian or numeric months and returns Persian labels", () => {
  assert.match(api, /normalizePayslipMonth/);
  assert.match(api, /const monthNumber = monthRaw \? normalizePayslipMonth\(monthRaw\) : null/);
  assert.match(api, /if \(monthNumber\) addCondition\("p\.month = \?", monthNumber\)/);
  assert.match(api, /month: PERSIAN_MONTHS\[Number\(item\.month\) - 1\] \|\| item\.month/);
});
