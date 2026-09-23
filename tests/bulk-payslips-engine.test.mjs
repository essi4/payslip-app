import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { calculatePayroll1405 } from "../app/lib/payroll-1405.js";

test("bulk payroll uses the same 1405 engine and preserves past seniority", async () => {
  const route = await fs.readFile(new URL("../app/api/payslips/bulk/route.js", import.meta.url), "utf8");
  assert.match(route, /calculatePayroll1405/);
  assert.match(route, /pastSeniorityAllowance/);
  assert.match(route, /payroll_period_id/);
  assert.match(route, /FOR UPDATE/);

  const calculation = calculatePayroll1405({
    year: 1405,
    monthNumber: 1,
    job_group: 6,
    work_days: 30,
    seniority_eligible: true,
  });

  assert.equal(calculation.groupDailyWage, 6292029);
  assert.equal(calculation.baseSalary, 188760870);
  assert.equal(calculation.pastSeniorityAllowance, 49765440);
  assert.ok(calculation.insurance > 0);
  assert.ok(calculation.netSalary > 0);
});

test("bulk payroll respects the actual Persian month workday count", () => {
  const calculation = calculatePayroll1405({
    year: 1405,
    monthNumber: 6,
    job_group: 6,
    work_days: 31,
  });

  assert.equal(calculation.monthDays, 31);
  assert.equal(calculation.workDays, 31);
  assert.equal(calculation.baseSalary, 195052899);
  assert.equal(calculation.pastSeniorityAllowance, 51424288);
});
