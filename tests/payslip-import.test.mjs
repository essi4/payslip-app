import test from "node:test";
import assert from "node:assert/strict";
import { normalizePayslipImportRows } from "../app/lib/payslip-import.js";

test("normalizes a valid Excel row into a payslip import payload", () => {
  const rows = normalizePayslipImportRows([
    {
      "کد پرسنلی": "13813",
      "سال": "1405",
      "ماه": "شهریور",
      "روز کارکرد": "31",
      "اضافه کاری": "20",
      "ماموریت": "2",
      "پاداش": "1000000",
      "سایر مزایا": "0",
      "سایر کسورات": "0",
    },
  ]);

  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], {
    personnel_code: "13813",
    year: "1405",
    month: "شهریور",
    work_days: 31,
    mission_days: 2,
    mission_hours: 0,
    overtime: 20,
    bonus: 1000000,
    housing_allowance: 0,
    food_allowance: 0,
    marriage_allowance: 0,
    child_allowance: 0,
    other_benefits: 0,
    other_deductions: 0,
  });
});

test("rejects rows without a personnel code", () => {
  assert.throws(
    () => normalizePayslipImportRows([{ "سال": "1405", "ماه": "شهریور", "روز کارکرد": "31" }]),
    /کد پرسنلی/
  );
});

test("rejects work days outside the allowed range", () => {
  assert.throws(
    () => normalizePayslipImportRows([{ "کد پرسنلی": "13813", "سال": "1405", "ماه": "شهریور", "روز کارکرد": "32" }]),
    /روز کارکرد/
  );
});
