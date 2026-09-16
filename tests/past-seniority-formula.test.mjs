import test from "node:test";
import assert from "node:assert/strict";
import { calculatePastSeniorityAllowance1405 } from "../app/lib/payroll-1405.js";

test("past seniority allowance uses 16,558,848 rial per worked day", () => {
  assert.equal(calculatePastSeniorityAllowance1405(31), 513324288);
  assert.equal(calculatePastSeniorityAllowance1405(30), 496765440);
});
