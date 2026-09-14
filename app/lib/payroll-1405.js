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

export const PAYROLL_1405_GROUP_WAGES = Object.freeze({ 6: 6292029 });

export function payrollNumber(value) { const n = Number(value); return Number.isFinite(n) ? n : 0; }
export function clampPayroll(value, min, max) { return Math.min(max, Math.max(min, payrollNumber(value))); }
export function roundPayroll(value) { return Math.round(payrollNumber(value)); }
export function daysInPersianMonth(year, month) { const y = Number(year); const m = Number(month); if (m >= 1 && m <= 6) return 31; if (m >= 7 && m <= 11) return 30; if (m === 12) return y % 4 === 3 ? 30 : 29; return 30; }
export function resolveGroupDailyWage(jobGroup) { const group = Number(String(jobGroup ?? "").trim()); return Number.isInteger(group) && group > 0 ? payrollNumber(PAYROLL_1405_GROUP_WAGES[group]) : 0; }

export function calculateProgressiveTax(taxableIncome) {
  let remaining = Math.max(0, payrollNumber(taxableIncome)); let previousLimit = 0; let tax = 0;
  for (const bracket of PAYROLL_1405.taxBrackets) { const upper = bracket.limit; const slice = Math.max(0, Math.min(remaining, upper - previousLimit)); tax += slice * bracket.rate; remaining -= slice; previousLimit = upper; if (remaining <= 0) break; }
  return roundPayroll(tax);
}

function hasValue(input, key) { return input[key] !== undefined && input[key] !== null && input[key] !== ""; }
function autoOrNumber(input, key, fallback) { return !hasValue(input, key) || payrollNumber(input[key]) === 0 ? fallback : payrollNumber(input[key]); }

export function calculatePayroll1405(input = {}) {
  const year = Number(input.year || 1405);
  const month = Number(input.monthNumber || input.month || 1);
  const monthDays = daysInPersianMonth(year, month);
  const workDays = clampPayroll(input.work_days || monthDays, 0, monthDays);
  const groupDailyWage = resolveGroupDailyWage(input.job_group);
  const suppliedBaseSalary = payrollNumber(input.base_salary);
  const baseSalary = suppliedBaseSalary > 0 ? suppliedBaseSalary : groupDailyWage > 0 ? groupDailyWage * workDays : 0;
  const baseSalarySource = suppliedBaseSalary > 0 ? "manual" : groupDailyWage > 0 ? "job_group" : "missing";
  const dailyWage = workDays > 0 ? baseSalary / workDays : 0;
  const hourlyWage = dailyWage / PAYROLL_1405.standardHoursPerDay;
  const missionDays = clampPayroll(input.mission_days, 0, workDays);
  const missionHours = clampPayroll(input.mission_hours, 0, Math.max(24, workDays * 24));
  const missionAllowance = missionDays * dailyWage + missionHours * hourlyWage;
  const seniorityEligible = input.seniority_eligible === true || input.seniority_eligible === "true";
  const seniorityDailyRate = payrollNumber(input.seniority_daily_rate) || PAYROLL_1405.seniorityDailyRate;
  const seniorityAllowance = seniorityEligible ? workDays * seniorityDailyRate : 0;
  const pastSeniorityAllowance = Math.max(0, payrollNumber(input.past_seniority_allowance));
  const proration = Math.min(workDays, 30) / 30;
  const housingAllowance = autoOrNumber(input, "housing_allowance", PAYROLL_1405.housingMonthly * proration);
  const foodAllowance = autoOrNumber(input, "food_allowance", PAYROLL_1405.foodMonthly * proration);
  const marriageAllowance = hasValue(input, "marriage_allowance") && payrollNumber(input.marriage_allowance) !== 0 ? payrollNumber(input.marriage_allowance) : (input.married ? PAYROLL_1405.marriageMonthly * proration : 0);
  const childAllowance = hasValue(input, "child_allowance") ? payrollNumber(input.child_allowance) : PAYROLL_1405.childPerChild * payrollNumber(input.child_count) * proration;
  const overtimeHours = payrollNumber(input.overtime_hours);
  const overtime = hasValue(input, "overtime") ? payrollNumber(input.overtime) : overtimeHours * hourlyWage * PAYROLL_1405.overtimeMultiplier;
  const bonus = payrollNumber(input.bonus);
  const otherBenefits = payrollNumber(input.other_benefits);
  const otherDeductions = payrollNumber(input.other_deductions);
  const insuranceBase = Math.max(0, baseSalary + pastSeniorityAllowance + seniorityAllowance + overtime + bonus + housingAllowance + foodAllowance + marriageAllowance + otherBenefits);
  const insurance = autoOrNumber(input, "insurance", roundPayroll(insuranceBase * PAYROLL_1405.insuranceEmployeeRate));
  const taxableGross = Math.max(0, baseSalary + pastSeniorityAllowance + seniorityAllowance + overtime + bonus + housingAllowance + foodAllowance + marriageAllowance + otherBenefits);
  const taxableIncome = Math.max(0, taxableGross - insurance);
  const tax = autoOrNumber(input, "tax", calculateProgressiveTax(taxableIncome));
  const totalBenefits = pastSeniorityAllowance + seniorityAllowance + missionAllowance + overtime + bonus + housingAllowance + foodAllowance + marriageAllowance + childAllowance + otherBenefits;
  const totalDeductions = insurance + tax + otherDeductions;
  const grossSalary = baseSalary + totalBenefits;
  const netSalary = grossSalary - totalDeductions;
  return { year, month, monthDays, workDays, jobGroup: String(input.job_group ?? "").trim(), groupDailyWage: roundPayroll(groupDailyWage), baseSalarySource, baseSalary: roundPayroll(baseSalary), dailyWage: roundPayroll(dailyWage), hourlyWage: roundPayroll(hourlyWage), missionDays, missionHours, missionAllowance: roundPayroll(missionAllowance), seniorityEligible, seniorityDailyRate: roundPayroll(seniorityDailyRate), seniorityAllowance: roundPayroll(seniorityAllowance), pastSeniorityAllowance: roundPayroll(pastSeniorityAllowance), overtimeHours, overtime: roundPayroll(overtime), bonus: roundPayroll(bonus), housingAllowance: roundPayroll(housingAllowance), foodAllowance: roundPayroll(foodAllowance), marriageAllowance: roundPayroll(marriageAllowance), childAllowance: roundPayroll(childAllowance), otherBenefits: roundPayroll(otherBenefits), insuranceBase: roundPayroll(insuranceBase), insurance: roundPayroll(insurance), taxableGross: roundPayroll(taxableGross), taxableIncome: roundPayroll(taxableIncome), tax: roundPayroll(tax), otherDeductions: roundPayroll(otherDeductions), grossSalary: roundPayroll(grossSalary), totalBenefits: roundPayroll(totalBenefits), totalDeductions: roundPayroll(totalDeductions), netSalary: roundPayroll(netSalary) };
}

export function payrollControlFlags(calc) {
  const flags = [];
  if (calc.baseSalary <= 0) flags.push({ level: "error", code: "BASE_ZERO", message: "حقوق پایه صفر یا نامعتبر است." });
  if (calc.netSalary < 0) flags.push({ level: "error", code: "NEGATIVE_NET", message: "خالص پرداختی منفی است." });
  if (calc.insurance < 0 || calc.tax < 0) flags.push({ level: "error", code: "NEGATIVE_DEDUCTION", message: "کسورات منفی هستند." });
  if (calc.jobGroup && calc.groupDailyWage <= 0) flags.push({ level: "warning", code: "GROUP_WAGE_MISSING", message: `جدول مزد گروه ${calc.jobGroup} برای ۱۴۰۵ در سیستم ثبت نشده است.` });
  if (calc.workDays > 0 && calc.baseSalary < PAYROLL_1405.minDailyWage * calc.workDays) flags.push({ level: "error", code: "BELOW_MIN_WAGE", message: "حقوق پایه از حداقل مزد قانونی ۱۴۰۵ برای روزهای کارکرد کمتر است." });
  if (calc.insurance !== roundPayroll(calc.insuranceBase * PAYROLL_1405.insuranceEmployeeRate)) flags.push({ level: "warning", code: "INSURANCE_MISMATCH", message: "بیمه با نرخ ۷٪ مبنای بیمه تطبیق ندارد." });
  if (calc.taxableIncome < PAYROLL_1405.monthlyTaxExemption && calc.tax > 0) flags.push({ level: "warning", code: "TAX_BELOW_EXEMPTION", message: "مالیات با وجود قرار داشتن درآمد مشمول مالیات زیر سقف معافیت ثبت شده است." });
  return flags;
}
