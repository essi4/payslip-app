const PERSIAN_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

export function normalizePayslipMonth(value) {
  const raw = String(value ?? "").trim();
  const numeric = Number(raw);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 12) return numeric;
  const index = PERSIAN_MONTHS.indexOf(raw);
  return index >= 0 ? index + 1 : null;
}
