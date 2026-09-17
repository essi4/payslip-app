const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

const FIELDS = {
  personnel_code: ["کد پرسنلی", "کدپرسنلی", "personnel_code"],
  year: ["سال", "year"],
  month: ["ماه", "month"],
  work_days: ["روز کارکرد", "روزکارکرد", "work_days"],
  mission_days: ["روز مأموریت", "روز ماموریت", "ماموریت", "mission_days"],
  mission_hours: ["ساعت مأموریت", "ساعت ماموریت", "mission_hours"],
  overtime: ["اضافه کاری", "اضافه‌کاری", "اضافه کار", "overtime"],
  bonus: ["پاداش", "bonus"],
  housing_allowance: ["حق مسکن", "مسکن", "housing_allowance"],
  food_allowance: ["بن", "حق خواربار", "بن کارگری", "food_allowance"],
  marriage_allowance: ["حق تأهل", "حق تاهل", "marriage_allowance"],
  child_allowance: ["حق اولاد", "child_allowance"],
  other_benefits: ["سایر مزایا", "other_benefits"],
  other_deductions: ["سایر کسورات", "other_deductions"],
};

function numeric(value) {
  if (value === null || value === undefined || value === "") return 0;
  const normalized = String(value).replace(/[٬,،]/g, "").replace(/[۰-۹]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit));
  const result = Number(normalized);
  return Number.isFinite(result) ? result : 0;
}

function text(value) {
  return String(value ?? "").trim();
}

function readField(row, names) {
  const key = Object.keys(row).find((candidate) => names.includes(String(candidate).trim()));
  return key ? row[key] : "";
}

export function normalizePayslipImportRows(rows) {
  if (!Array.isArray(rows)) throw new Error("ساختار فایل Excel نامعتبر است.");
  return rows.map((row, index) => {
    const personnelCode = text(readField(row, FIELDS.personnel_code));
    const year = text(readField(row, FIELDS.year)) || "1405";
    const month = text(readField(row, FIELDS.month));
    const workDays = numeric(readField(row, FIELDS.work_days));
    if (!personnelCode) throw new Error(`ردیف ${index + 2}: کد پرسنلی وارد نشده است.`);
    if (!month || !MONTHS.includes(month) && !(Number(month) >= 1 && Number(month) <= 12)) throw new Error(`ردیف ${index + 2}: ماه حقوق نامعتبر است.`);
    if (!Number.isInteger(Number(year)) || Number(year) !== 1405) throw new Error(`ردیف ${index + 2}: این نسخه فقط سال ۱۴۰۵ را پشتیبانی می‌کند.`);
    if (workDays < 1 || workDays > 31) throw new Error(`ردیف ${index + 2}: روز کارکرد باید بین ۱ تا ۳۱ باشد.`);
    return {
      personnel_code: personnelCode,
      year,
      month,
      work_days: workDays,
      mission_days: numeric(readField(row, FIELDS.mission_days)),
      mission_hours: numeric(readField(row, FIELDS.mission_hours)),
      overtime: numeric(readField(row, FIELDS.overtime)),
      bonus: numeric(readField(row, FIELDS.bonus)),
      housing_allowance: numeric(readField(row, FIELDS.housing_allowance)),
      food_allowance: numeric(readField(row, FIELDS.food_allowance)),
      marriage_allowance: numeric(readField(row, FIELDS.marriage_allowance)),
      child_allowance: numeric(readField(row, FIELDS.child_allowance)),
      other_benefits: numeric(readField(row, FIELDS.other_benefits)),
      other_deductions: numeric(readField(row, FIELDS.other_deductions)),
    };
  });
}

export const PAYSLIP_IMPORT_TEMPLATE_COLUMNS = [
  "کد پرسنلی", "سال", "ماه", "روز کارکرد", "روز مأموریت", "ساعت مأموریت", "اضافه کاری", "پاداش", "حق مسکن", "بن", "حق تأهل", "حق اولاد", "سایر مزایا", "سایر کسورات",
];
