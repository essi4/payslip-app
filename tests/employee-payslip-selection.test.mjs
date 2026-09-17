import test from "node:test";
import assert from "node:assert/strict";
import { getPayslipYears, getAvailablePayslipMonths } from "../app/lib/payslip-selection.js";

test("returns only years and months that belong to the employee payslips", () => {
  const months = [
    { year: 1405, month: "شهریور", id: 3 },
    { year: 1405, month: "تیر", id: 2 },
    { year: 1404, month: "اسفند", id: 1 },
  ];

  assert.deepEqual(getPayslipYears(months), ["1405", "1404"]);
  assert.deepEqual(
    getAvailablePayslipMonths(months, "1405").map((item) => item.month),
    ["تیر", "شهریور"],
  );
});

test("returns an empty month list for a year with no payslips", () => {
  const months = [{ year: 1405, month: "شهریور" }];
  assert.deepEqual(getAvailablePayslipMonths(months, "1404"), []);
});
