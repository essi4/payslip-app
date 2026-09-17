import test from "node:test";
import assert from "node:assert/strict";
import { buildPayslipBreakdown } from "../app/lib/payslip-breakdown.js";

test("payslip breakdown contains every stored payment and deduction", () => {
  const breakdown = buildPayslipBreakdown({
    base_salary: 62920290,
    seniority_allowance: 1666670,
    past_seniority_allowance: 16588480,
    mission_allowance: 1250000,
    overtime: 900000,
    bonus: 500000,
    housing_allowance: 3000000,
    food_allowance: 2200000,
    marriage_allowance: 500000,
    child_allowance: 0,
    other_benefits: 250000,
    insurance: 6500000,
    tax: 1200000,
    other_deductions: 350000,
  });

  assert.deepEqual(
    breakdown.payments.map((item) => item.key),
    [
      "base_salary",
      "seniority_allowance",
      "past_seniority_allowance",
      "mission_allowance",
      "overtime",
      "bonus",
      "housing_allowance",
      "food_allowance",
      "marriage_allowance",
      "child_allowance",
      "other_benefits",
    ],
  );
  assert.deepEqual(
    breakdown.deductions.map((item) => item.key),
    ["insurance", "tax", "other_deductions"],
  );
  assert.equal(breakdown.totalPayments, 89775440);
  assert.equal(breakdown.totalDeductions, 8050000);
});
