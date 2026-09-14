export const PAYROLL_1405 = Object.freeze({
  minDailyWage: 5541850,
  seniorityDailyRate: 166667,
  housingMonthly: 30000000,
  foodMonthly: 22000000,
  marriageMonthly: 5000000,
  childPerChild: 16625550,
  insuranceEmployeeRate: 0.07,
  insuranceEmployerRate: 0.23,
  overtimeMultiplier: 1.4,
  standardHoursPerDay: 7.3333333333,
  monthlyTaxExemption: 400000000,
  taxBrackets: [
    { limit: 400000000, rate: 0.00 },
    { limit: 800000000, rate: 0.10 },
    { limit: 1000000000, rate: 0.15 },
    { limit: 1200000000, rate: 0.20 },
    { limit: 1400000000, rate: 0.25 },
    { limit: Infinity, rate: 0.30 },
  ],
});

export function payrollNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function clampPayroll(value, min, max) {
  return Math.min(max, Math.max(min, payrollNumber(value)));
}

export function roundPayroll(value) {
  return Math.round(payrollNumber(value));
}

export function daysInPersianMonth(year, month) {
  const y = Number(year);
  const m = Number(month);
  if (m >= 1 && m <= 6) return 31;
  if (m >= 7 && m <= 11) return 30;
  if (m === 12) return y % 4 === 3 ? 30 : 29;
  return 30;
}

export function calculateProgressiveTax(taxableIncome) {
  let remaining = Math.max(0, payrollNumber(taxableIncome));
  let previousLimit = 0;
  let tax = 0;
  for (const bracket of PAYROLL_1405.taxBrackets) {
    const upper = bracket.limit;
    const slice = Math.max(0, Math.min(remaining, upper - previousLimit));
    tax += slice * bracket.rate;
    remaining -= slice;
    previousLimit = upper;
    if (remaining <= 0) break;
  }
  return roundPayroll(tax);
}

/**
 * Unified 1405 payroll calculation.
 * All monetary values are ریال.
 *
 * Insurance base: taxable/insurance-bearing wage items, excluding mission and child allowance.
 * Tax base: taxable gross items minus employee insurance; mission and child allowance are excluded.
 */
export function calculatePayroll1405(input = {}) {
  const year = Number(input.year || 1405);
  const month = Number(input.monthNumber || input.month || 1);
  const monthDays = daysInPersianMonth(year, month);
  const workDays = clampPayroll(input.work_days || monthDays, 0, monthDays);
  const baseSalary = payrollNumber(input.base_salary);
  const dailyWage = workDays > 0 ? baseSalary / workDays : 0;
  const hourlyWage = dailyWage / PAYROLL_1405.standardHoursPerDay;

  const missionDays = clampPayroll(input.mission_days, 0, workDays);
  const missionHours = clampPayroll(input.mission_hours, 0, Math.max(24, workDays * 24));
  const missionAllowance = missionDays * dailyWage + missionHours * hourlyWage;

  const seniorityEligible = input.seniority_eligible === true || input.seniority_eligible === "true";
  const seniorityDailyRate = payrollNumber(input.seniority_daily_rate) || PAYROLL_1405.seniorityDailyRate;
  const seniorityAllowance = seniorityEligible ? workDays * seniorityDailyRate : 0;

  const proration = Math.min(workDays, 30) / 30;
  const housingAllowance = input.housing_allowance === undefined ? PAYROLL_1405.housingMonthly * proration : payrollNumber(input.housing_allowance);
  const foodAllowance = input.food_allowance === undefined ? PAYROLL_1405.foodMonthly * proration : payrollNumber(input.food_allowance);
  const marriageAllowance = input.marriage_allowance === undefined ? (input.married ? PAYROLL_1405.marriageMonthly * proration : 0) : payrollNumber(input.marriage_allowance);
  const childAllowance = input.child_allowance === undefined ? PAYROLL_1405.childPerChild * payrollNumber(input.child_count) * proration : payrollNumber(input.child_allowance);

  const overtimeHours = payrollNumber(input.overtime_hours);
  const overtime = input.overtime === undefined
    ? overtimeHours * hourlyWage * PAYROLL_1405.overtimeMultiplier
    : payrollNumber(input.overtime);
  const bonus = payrollNumber(input.bonus);
  const otherBenefits = payrollNumber(input.other_benefits);
  const otherDeductions = payrollNumber(input.other_deductions);

  const insuranceBase = Math.max(0, baseSalary + seniorityAllowance + overtime + bonus + housingAllowance + foodAllowance + marriageAllowance + otherBenefits);
  const insurance = input.insurance === undefined ? roundPayroll(insuranceBase * PAYROLL_1405.insuranceEmployeeRate) : Math.max(0, payrollNumber(input.insurance));

  const taxableGross = Math.max(0, baseSalary + seniorityAllowance + overtime + bonus + housingAllowance + foodAllowance + marriageAllowance + otherBenefits);
  const taxableIncome = Math.max(0, taxableGross - insurance);
  const tax = input.tax === undefined ? calculateProgressiveTax(taxableIncome) : Math.max(0, payrollNumber(input.tax));

  const totalBenefits = seniorityAllowance + missionAllowance + overtime + bonus + housingAllowance + foodAllowance + marriageAllowance + childAllowance + otherBenefits;
  const totalDeductions = insurance + tax + otherDeductions;
  const grossSalary = baseSalary + totalBenefits;
  const netSalary = grossSalary - totalDeductions;

  return {
    year,
    month,
    monthDays,
    workDays,
    baseSalary: roundPayroll(baseSalary),
    dailyWage: roundPayroll(dailyWage),
    hourlyWage: roundPayroll(hourlyWage),
    missionDays,
    missionHours,
    missionAllowance: roundPayroll(missionAllowance),
    seniorityEligible,
    seniorityDailyRate: roundPayroll(seniorityDailyRate),
    seniorityAllowance: roundPayroll(seniorityAllowance),
    overtimeHours,
    overtime: roundPayroll(overtime),
    bonus: roundPayroll(bonus),
    housingAllowance: roundPayroll(housingAllowance),
    foodAllowance: roundPayroll(foodAllowance),
    marriageAllowance: roundPayroll(marriageAllowance),
    childAllowance: roundPayroll(childAllowance),
    otherBenefits: roundPayroll(otherBenefits),
    insuranceBase: roundPayroll(insuranceBase),
    insurance: roundPayroll(insurance),
    taxableGross: roundPayroll(taxableGross),
    taxableIncome: roundPayroll(taxableIncome),
    tax: roundPayroll(tax),
    otherDeductions: roundPayroll(otherDeductions),
    grossSalary: roundPayroll(grossSalary),
    totalBenefits: roundPayroll(totalBenefits),
    totalDeductions: roundPayroll(totalDeductions),
    netSalary: roundPayroll(netSalary),
  };
}

export function payrollControlFlags(calc) {
  const flags = [];
  if (calc.baseSalary <= 0) flags.push({ level: "error", code: "BASE_ZERO", message: "حقوق پایه صفر یا نامعتبر است." });
  if (calc.netSalary < 0) flags.push({ level: "error", code: "NEGATIVE_NET", message: "خالص پرداختی منفی است." });
  if (calc.insurance < 0 || calc.tax < 0) flags.push({ level: "error", code: "NEGATIVE_DEDUCTION", message: "کسورات منفی هستند." });
  if (calc.insurance !== roundPayroll(calc.insuranceBase * PAYROLL_1405.insuranceEmployeeRate)) flags.push({ level: "warning", code: "INSURANCE_MISMATCH", message: "بیمه با نرخ ۷٪ مبنای بیمه تطبیق ندارد." });
  if (calc.taxableIncome < PAYROLL_1405.monthlyTaxExemption && calc.tax > 0) flags.push({ level: "warning", code: "TAX_BELOW_EXEMPTION", message: "مالیات با وجود قرار داشتن درآمد مشمول مالیات زیر سقف معافیت ثبت شده است." });
  return flags;
}
