import test from "node:test";
import assert from "node:assert/strict";
import { normalizePayslipMonth } from "../app/lib/payslip-month.js";

test("normalizePayslipMonth converts Persian month names to numeric month values", () => {
  assert.equal(normalizePayslipMonth("فروردین"), 1);
  assert.equal(normalizePayslipMonth("شهریور"), 6);
  assert.equal(normalizePayslipMonth("12"), 12);
});
