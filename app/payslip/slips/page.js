"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  CreditCard,
  FileText,
  IdCard,
  Landmark,
  Printer,
  UserRound,
} from "lucide-react";
import { buildPayslipBreakdown } from "../../lib/payslip-breakdown";
import { getPayslipYears, getAvailablePayslipMonths } from "../../lib/payslip-selection";

function rial(value) {
  return Number(value || 0).toLocaleString("fa-IR") + " ریال";
}

function toman(value) {
  return Math.round(Number(value || 0) / 10).toLocaleString("fa-IR") + " تومان";
}

function formatLabel(value) {
  return String(value ?? "").trim() || "—";
}

function MoneyRow({ item, tone = "normal" }) {
  const positive = tone !== "red";

  return (
    <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-4 py-3.5 first:border-t-0 sm:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={positive ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700" : "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700"}>
          {positive ? <ArrowUpLeft size={14} strokeWidth={2.5} aria-hidden="true" /> : <ArrowDownLeft size={14} strokeWidth={2.5} aria-hidden="true" />}
        </span>
        <span className="truncate text-xs font-bold text-slate-600 sm:text-sm">{item.label}</span>
      </div>
      <div className="shrink-0 text-left">
        <div className={positive ? "whitespace-nowrap text-xs font-black text-slate-900 sm:text-sm" : "whitespace-nowrap text-xs font-black text-rose-700 sm:text-sm"}>{toman(item.amount)}</div>
        <div className="mt-0.5 text-[9px] font-semibold text-slate-400">{rial(item.amount)}</div>
      </div>
    </div>
  );
}

function Detail({ label, value, Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm">
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
        <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
        <span>{label}</span>
      </div>
      <div className="mt-2 truncate text-xs font-black text-slate-800 sm:text-sm">{formatLabel(value)}</div>
    </div>
  );
}

function PeriodPicker({ years, availableMonths, selectedYear, selectedMonth, setSelectedYear, setSelectedMonth }) {
  return (
    <section className="mb-5 rounded-[26px] border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <CalendarDays size={19} strokeWidth={2.3} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-950">انتخاب دوره فیش</h2>
            <p className="mt-0.5 text-[10px] font-bold text-slate-400">فقط دوره‌هایی که برای شما صادر شده نمایش داده می‌شوند.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:min-w-[310px]">
          <label className="block">
            <span className="sr-only">سال فیش</span>
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-black text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
            >
              {years.length ? years.map((year) => <option key={year} value={year}>{year}</option>) : <option value="">—</option>}
            </select>
          </label>

          <label className="block">
            <span className="sr-only">ماه فیش</span>
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-black text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
            >
              {availableMonths.length ? availableMonths.map((item) => <option key={String(item.year) + "-" + String(item.month) + "-" + (item.id || "payslip")} value={item.month}>{item.month}</option>) : <option value="">—</option>}
            </select>
          </label>
        </div>
      </div>
    </section>
  );
}

export default function EmployeePayslipsPage() {
  const [months, setMonths] = useState([]);
  const [selected, setSelected] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [payslipLoading, setPayslipLoading] = useState(false);
  const [error, setError] = useState("");

  const years = useMemo(() => getPayslipYears(months), [months]);
  const availableMonths = useMemo(
    () => getAvailablePayslipMonths(months, selectedYear),
    [months, selectedYear],
  );

  async function loadPayslip(year, month) {
    if (!year || !month) {
      setSelected(null);
      return;
    }

    setPayslipLoading(true);
    setError("");

    try {
      const response = await fetch("/api/payslip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ year, month }),
      });
      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "فیش قابل نمایش نیست.");
      }

      setSelected(data.data?.[0] || data.payslip || null);
    } catch (err) {
      setSelected(null);
      setError(err.message || "خطا در دریافت فیش.");
    } finally {
      setPayslipLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadList() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/payslip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({}),
        });
        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error(data?.error || "دریافت فیش‌ها انجام نشد.");
        }
        if (!active) return;

        setEmployee(data.employee || null);

        const list = Array.isArray(data.months) ? [...data.months] : [];
        setMonths(list);

        const firstYear = getPayslipYears(list)[0] || "";
        const firstMonth = getAvailablePayslipMonths(list, firstYear)[0]?.month || "";
        setSelectedYear(firstYear);
        setSelectedMonth(String(firstMonth || ""));
      } catch (err) {
        if (active) setError(err.message || "خطا در دریافت فیش‌ها.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadList();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedYear) return;
    if (!availableMonths.some((item) => String(item.month) === String(selectedMonth))) {
      setSelectedMonth(String(availableMonths[0]?.month || ""));
    }
  }, [availableMonths, selectedMonth, selectedYear]);

  useEffect(() => {
    if (selectedYear && selectedMonth) {
      loadPayslip(selectedYear, selectedMonth);
    }
  }, [selectedYear, selectedMonth]);

  if (loading) {
    return (
      <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl animate-pulse">
          <div className="mb-5 h-24 rounded-[26px] bg-white shadow-sm" />
          <div className="h-14 rounded-[26px] bg-white shadow-sm" />
          <div className="mt-5 h-[520px] rounded-[30px] bg-white shadow-sm" />
        </div>
      </main>
    );
  }

  if (!selected) {
    return (
      <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <header className="mb-5 rounded-[30px] bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <FileText size={23} strokeWidth={2.2} aria-hidden="true" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-blue-200">سامانه حقوق و دستمزد</div>
                <h1 className="mt-1 text-xl font-black sm:text-2xl">فیش‌های حقوقی من</h1>
              </div>
            </div>
            <p className="mt-4 text-xs font-bold leading-6 text-slate-300">
              {employee?.full_name || "کاربر گرامی"} — {months.length ? "برای این دوره فیش قابل نمایش نیست." : "هنوز فیشی برای شما ثبت نشده است."}
            </p>
          </header>

          {months.length > 0 && (
            <PeriodPicker {...{ years, availableMonths, selectedYear, selectedMonth, setSelectedYear, setSelectedMonth }} />
          )}

          <section className="rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
              <FileText size={28} strokeWidth={2} aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-base font-black text-slate-900">فیشی برای نمایش پیدا نشد</h2>
            {error && <p className="mx-auto mt-2 max-w-md text-xs font-bold leading-6 text-rose-600">{error}</p>}
            <Link href="/payslip/dashboard" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-xs font-black text-white shadow-lg shadow-blue-700/20">
              بازگشت به داشبورد
              <ChevronLeft size={16} aria-hidden="true" />
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const p = selected;
  const breakdown = buildPayslipBreakdown(p);

  const employeeDetails = [
    ["نام و نام خانوادگی", p.full_name, UserRound],
    ["کد ملی", p.national_id, IdCard],
    ["کد پرسنلی", p.personnel_code, ClipboardList],
    ["عنوان شغلی", p.job_title || p.employee_job_title, BriefcaseBusiness],
    ["گروه مزدی", p.job_group, FileText],
    ["واحد / دپارتمان", p.department, Building2],
    ["روزهای کارکرد", p.work_days, CalendarDays],
    ["روز مأموریت", p.mission_days, ClipboardList],
    ["شماره حساب", p.bank_account, CreditCard],
  ];

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-3 py-5 sm:px-5 sm:py-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print:hidden">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black text-blue-700">
              <FileText size={14} aria-hidden="true" />
              فیش‌های حقوقی من
            </div>
            <h1 className="mt-1.5 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">فیش حقوقی</h1>
            <p className="mt-1.5 text-xs font-bold text-slate-500">
              {formatLabel(employee?.full_name)} · {formatLabel(employee?.company_name)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              aria-label="سال فیش"
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-800 shadow-sm outline-none focus:border-blue-500"
            >
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
            <select
              aria-label="ماه فیش"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-800 shadow-sm outline-none focus:border-blue-500"
            >
              {availableMonths.map((item) => <option key={String(item.year) + "-" + String(item.month) + "-" + (item.id || "payslip")} value={item.month}>{item.month}</option>)}
            </select>
          </div>
        </header>

        <PeriodPicker {...{ years, availableMonths, selectedYear, selectedMonth, setSelectedYear, setSelectedMonth }} />

        <article className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.3)] print:rounded-none print:border-0 print:shadow-none">
          <header className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-5 py-7 text-white sm:px-8 sm:py-9">
            <div className="absolute -left-14 -top-16 h-52 w-52 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute -bottom-24 -right-8 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl" />

            <div className="relative grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black text-blue-100">
                  <CheckCircle2 size={13} aria-hidden="true" />
                  {formatLabel(p.company_name)} · {formatLabel(p.month)} {formatLabel(p.year)}
                </div>
                <h2 className="text-2xl font-black tracking-tight sm:text-3xl">فیش حقوق و دستمزد</h2>
                <p className="mt-2 text-xs font-bold text-slate-300 sm:text-sm">
                  {formatLabel(p.full_name)} · کد پرسنلی {formatLabel(p.personnel_code)}
                </p>
              </div>

              <div className="rounded-[26px] border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-md sm:min-w-[245px] sm:px-6 sm:py-5">
                <div className="text-[10px] font-bold text-blue-200">خالص پرداختی</div>
                <div className="mt-1 text-2xl font-black sm:text-3xl">{toman(p.net_salary)}</div>
                <div className="mt-1 text-[10px] font-semibold text-slate-300">{rial(p.net_salary)}</div>
              </div>
            </div>
          </header>

          <section className="border-b border-slate-200 bg-slate-50 px-4 py-5 sm:px-7 sm:py-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">مشخصات پرسنلی و کارکرد</h3>
                <p className="mt-1 text-[10px] font-bold text-slate-400">اطلاعات ثبت‌شده برای همین دوره</p>
              </div>
              <span className="hidden items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-[9px] font-black text-blue-700 sm:inline-flex">
                <Landmark size={13} aria-hidden="true" />
                پرونده پرسنلی
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              {employeeDetails.map(([label, value, Icon]) => (
                <Detail key={label} label={label} value={value} Icon={Icon} />
              ))}
            </div>
          </section>

          <section className="grid gap-4 p-4 sm:grid-cols-2 sm:p-7">
            <div className="overflow-hidden rounded-[28px] border border-emerald-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 bg-emerald-50 px-5 py-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-black text-emerald-950">
                    <ArrowUpLeft size={17} aria-hidden="true" />
                    پرداختی‌ها و مزایا
                  </div>
                  <div className="mt-1 text-[9px] font-bold text-emerald-600">تمام اقلام پرداختی ثبت‌شده</div>
                </div>
                <span className="rounded-xl bg-white px-3 py-2 text-xs font-black text-emerald-700 shadow-sm">{toman(breakdown.totalPayments)}</span>
              </div>

              {breakdown.payments.map((item) => (
                <MoneyRow key={item.key} item={item} />
              ))}

              <div className="flex items-center justify-between border-t border-emerald-200 bg-emerald-50/70 px-5 py-4">
                <span className="text-xs font-black text-emerald-950">جمع کل پرداختی‌ها</span>
                <span className="text-sm font-black text-emerald-800">{toman(breakdown.totalPayments)}</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-rose-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 bg-rose-50 px-5 py-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-black text-rose-950">
                    <ArrowDownLeft size={17} aria-hidden="true" />
                    کسورات
                  </div>
                  <div className="mt-1 text-[9px] font-bold text-rose-600">بیمه، مالیات و سایر کسورات</div>
                </div>
                <span className="rounded-xl bg-white px-3 py-2 text-xs font-black text-rose-700 shadow-sm">{toman(breakdown.totalDeductions)}</span>
              </div>

              {breakdown.deductions.map((item) => (
                <MoneyRow key={item.key} item={item} tone="red" />
              ))}

              <div className="flex items-center justify-between border-t border-rose-200 bg-rose-50/70 px-5 py-4">
                <span className="text-xs font-black text-rose-950">جمع کل کسورات</span>
                <span className="text-sm font-black text-rose-800">{toman(breakdown.totalDeductions)}</span>
              </div>
            </div>
          </section>

          <section className="mx-4 mb-5 rounded-[28px] bg-gradient-to-l from-blue-700 to-indigo-700 p-5 text-white shadow-lg shadow-blue-700/20 sm:mx-7 sm:mb-7 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-blue-100">
                  <CreditCard size={15} aria-hidden="true" />
                  مبلغ نهایی قابل واریز به حساب
                </div>
                <div className="mt-1 text-2xl font-black sm:text-3xl">{toman(p.net_salary)}</div>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-left text-xs font-bold text-blue-50">
                {rial(p.net_salary)}
              </div>
            </div>
          </section>

          <footer className="no-print flex flex-col gap-2 border-t border-slate-100 bg-slate-50 p-4 sm:flex-row sm:p-5">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-slate-800"
            >
              <Printer size={17} aria-hidden="true" />
              چاپ فیش
            </button>
            <Link
              href="/payslip/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-center text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              <ChevronLeft size={17} aria-hidden="true" />
              بازگشت به داشبورد
            </Link>
            {payslipLoading && (
              <div className="sm:mr-auto self-center text-center text-xs font-black text-blue-600">
                در حال بروزرسانی فیش...
              </div>
            )}
          </footer>
        </article>

        {error && (
          <div className="mt-3 rounded-2xl border border-rose-100 bg-rose-50 p-3 text-center text-xs font-bold text-rose-700">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
