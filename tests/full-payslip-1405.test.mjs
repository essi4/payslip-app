import test from "node:test";
import assert from "node:assert/strict";

const GROUP_6_DAILY = 6292029;
const SENIORITY_DAILY = 166667;
const HOUSING = 30000000;
const FOOD = 22000000;
const INSURANCE_RATE = 0.07;
const TAX_EXEMPTION = 400000000;

function progressiveTax(taxable) {
  const brackets = [[400000000, 0], [800000000, 0.10], [1000000000, 0.15], [1200000000, 0.20], [1400000000, 0.25], [Infinity, 0.30]];
  let remaining = Math.max(0, taxable), previous = 0, tax = 0;
  for (const [limit, rate] of brackets) {
    const slice = Math.max(0, Math.min(remaining, limit - previous));
    tax += slice * rate;
    remaining -= slice;
    previous = limit;
    if (remaining <= 0) break;
  }
  return Math.round(tax);
}

function fullPayslip(days) {
  const base = GROUP_6_DAILY * days;
  const seniority = SENIORITY_DAILY * days;
  const housing = HOUSING * Math.min(days, 30) / 30;
  const food = FOOD * Math.min(days, 30) / 30;
  const gross = base + seniority + housing + food;
  const insuranceBase = gross;
  const insurance = Math.round(insuranceBase * INSURANCE_RATE);
  const taxable = Math.max(0, gross - insurance);
  const tax = taxable <= TAX_EXEMPTION ? 0 : progressiveTax(taxable);
  const net = gross - insurance - tax;
  return { base, seniority, housing, food, gross, insurance, taxable, tax, net };
}

test("30-day group 6 payslip calculates base, benefits, 7% insurance, tax and net", () => {
  const c = fullPayslip(30);
  assert.equal(c.base, 188760870);
  assert.equal(c.seniority, 5000010);
  assert.equal(c.housing, 30000000);
  assert.equal(c.food, 22000000);
  assert.equal(c.insurance, Math.round(c.gross * 0.07));
  assert.equal(c.tax, 0);
  assert.equal(c.net, c.gross - c.insurance);
});

test("31-day group 6 payslip recalculates the full payslip, not only base salary", () => {
  const c30 = fullPayslip(30);
  const c31 = fullPayslip(31);
  assert.equal(c31.base, 195052899);
  assert.equal(c31.seniority, 5166677);
  assert.equal(c31.housing, c30.housing);
  assert.equal(c31.food, c30.food);
  assert.equal(c31.insurance, Math.round(c31.gross * 0.07));
  assert.ok(c31.net > c30.net);
  assert.equal(c31.net - c30.net, c31.base - c30.base + c31.seniority - c30.seniority - (c31.insurance - c30.insurance));
});
