import test from "node:test";
import assert from "node:assert/strict";
import { EMPLOYEE_PANEL_HOME_PATH, EMPLOYEE_PANEL_CARDS } from "../app/lib/employee-panel.js";

test("employee panel keeps payslips inside the payslips card flow", () => {
  assert.equal(EMPLOYEE_PANEL_HOME_PATH, "/payslip/dashboard");
  assert.deepEqual(
    EMPLOYEE_PANEL_CARDS.map(({ title, href }) => ({ title, href })),
    [
      { title: "فیش‌های حقوقی من", href: "/payslip/slips" },
      { title: "حکم کارگزینی", href: "/payslip/order" },
      { title: "حساب من", href: "/payslip/account" },
    ],
  );
});
