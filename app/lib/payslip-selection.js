const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

function monthOrder(value) {
  const n = Number(value);
  if (Number.isFinite(n) && n >= 1 && n <= 12) return n;
  const index = MONTHS.indexOf(String(value || "").trim());
  return index >= 0 ? index + 1 : Number.MAX_SAFE_INTEGER;
}

export function getPayslipYears(months = []) {
  return [...new Set(months.map((item) => String(item?.year || "")).filter(Boolean))]
    .sort((a, b) => Number(b) - Number(a));
}

export function getAvailablePayslipMonths(months = [], year = "") {
  return months
    .filter((item) => String(item?.year || "") === String(year))
    .sort((a, b) => monthOrder(a?.month) - monthOrder(b?.month));
}
