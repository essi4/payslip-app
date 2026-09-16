function normalizeEmployeeForm(form) {
  return {
    name: String(form.name || "").trim(),
    nationalId: String(form.nationalId || "").replace(/\D/g, ""),
    personnelCode: String(form.personnelCode || "").trim(),
    mobile: String(form.mobile || "").trim(),
    maritalStatus: String(form.maritalStatus || "").trim(),
    childrenCount: Math.max(0, Number(form.childrenCount || 0)),
    hireDate: String(form.hireDate || "").trim(),
    lastOrderNumber: String(form.lastOrderNumber || "").trim(),
    lastOrderDate: String(form.lastOrderDate || "").trim(),
    bankAccount: String(form.bankAccount || "").trim(),
    iban: String(form.iban || "").trim().toUpperCase(),
    bankName: String(form.bankName || "").trim(),
    department: String(form.department || "").trim(),
    jobGroup: String(form.jobGroup || "").trim(),
    role: String(form.role || "").trim(),
    email: String(form.email || "").trim().toLowerCase(),
    payslipPassword: String(form.payslipPassword || "").trim(),
    isActive: form.isActive !== false,
    companyId: String(form.companyId || ""),
  };
}

function isValidJobGroup(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 20;
}

module.exports = { normalizeEmployeeForm, isValidJobGroup };
