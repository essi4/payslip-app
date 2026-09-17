export const PAYSLIP_PAYMENT_FIELDS = Object.freeze([
  ["base_salary", "حقوق پایه"],
  ["seniority_allowance", "مزد سنوات جاری"],
  ["past_seniority_allowance", "مزد سنوات سال‌های گذشته"],
  ["mission_allowance", "حق مأموریت"],
  ["overtime", "اضافه‌کاری"],
  ["bonus", "پاداش"],
  ["housing_allowance", "حق مسکن"],
  ["food_allowance", "بن کارگری"],
  ["marriage_allowance", "حق تأهل"],
  ["child_allowance", "حق اولاد"],
  ["other_benefits", "سایر مزایا"],
]);

export const PAYSLIP_DEDUCTION_FIELDS = Object.freeze([
  ["insurance", "بیمه سهم کارمند"],
  ["tax", "مالیات"],
  ["other_deductions", "سایر کسورات"],
]);

function amount(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function toItems(fields, payslip) {
  return fields.map(([key, label]) => ({ key, label, amount: amount(payslip?.[key]) }));
}

export function buildPayslipBreakdown(payslip = {}) {
  const payments = toItems(PAYSLIP_PAYMENT_FIELDS, payslip);
  const deductions = toItems(PAYSLIP_DEDUCTION_FIELDS, payslip);
  return {
    payments,
    deductions,
    totalPayments: payments.reduce((sum, item) => sum + item.amount, 0),
    totalDeductions: deductions.reduce((sum, item) => sum + item.amount, 0),
  };
}
