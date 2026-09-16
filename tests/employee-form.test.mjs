import test from "node:test";
import assert from "node:assert/strict";
import { normalizeEmployeeForm, isValidJobGroup } from "../app/admin/employees/form-utils.js";

test("normalizes the employee master fields", () => {
  const result = normalizeEmployeeForm({
    name: " علی رضایی ", nationalId: "0012345678", personnelCode: "71000822",
    mobile: "09171234567", maritalStatus: "متأهل", childrenCount: "2",
    hireDate: "1404/01/15", lastOrderNumber: "ح-1405-22", lastOrderDate: "1405/01/01",
    bankAccount: "123", iban: "ir123", bankName: "ملت", department: "مالی",
    jobGroup: "6", role: "کارشناس", email: " A@EXAMPLE.COM ", payslipPassword: "1234", isActive: true,
  });
  assert.equal(result.mobile, "09171234567");
  assert.equal(result.childrenCount, 2);
  assert.equal(result.email, "a@example.com");
  assert.equal(result.iban, "IR123");
  assert.equal(result.jobGroup, "6");
  assert.equal(result.isActive, true);
});

test("accepts only wage groups 1 through 20", () => {
  assert.equal(isValidJobGroup("1"), true);
  assert.equal(isValidJobGroup("20"), true);
  assert.equal(isValidJobGroup("0"), false);
  assert.equal(isValidJobGroup("21"), false);
});
