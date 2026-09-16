export function calculateBaseSalary(dailyBaseSalary, workDays) {
  const daily = Number(dailyBaseSalary);
  const days = Number(workDays);
  if (!Number.isFinite(daily) || daily < 0) throw new Error("مزد روزانه نامعتبر است.");
  if (!Number.isInteger(days) || days < 1 || days > 31) throw new Error("تعداد روز کار باید بین ۱ تا ۳۱ باشد.");
  return Math.round(daily * days);
}
