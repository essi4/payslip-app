import test from "node:test";
import assert from "node:assert/strict";
import { calculateBaseSalary } from "../app/lib/payroll-calculation.mjs";

test("base salary is derived from the selected wage group's daily rate", () => {
  assert.equal(calculateBaseSalary(6292029, 30), 188760870);
  assert.equal(calculateBaseSalary(6292029, 31), 195052899);
});
