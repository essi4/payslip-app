"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buildPayslipBreakdown } from "../../lib/payslip-breakdown";
import { getPayslipYears, getAvailablePayslipMonths } from "../../lib/payslip-selection";

function rial(value) {
  return `${Number(value || 0).toLocaleString("fa-IR")} ریال`;
}

function toman(value) {
  return `${Math.round(Number(value || 0) / 10).toLocaleString("fa-IR")} تومان`;
}

function formatLabel(value) {
  return String(value ?? "").trim() || "—";
}

const jalaliMonths = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

function MoneyRow({ item, tone = "normal" }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:px-5">
      <span className="text-xs font-bold text-slate-600 sm:text-sm">{item.label}</span>
      <div className="text-left">
        <div className={`whitespace-nowrap text-xs font-black sm:text-sm ${tone === "red" ? "text-rose-700" : "text-slate-900"}`}>{toman(item.amount)}</div>
        <div className="mt-0.5 text-[9px] font-semibold text-slate-400">{rial(item.amount)}</div>
      </div>
    </div>
  );
}

function Detail({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-3 transition hover:border-blue-200 hover:shadow-sm">
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400"><span>{icon}</span><span>{label}</span></div>
      <div className="mt-1.5 truncate text-xs font-black text-slate-800 sm:text-sm">{formatLabel(value)}</div>
    </div>
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
  const availableMonths = useMemo(() => getAvailablePayslipMonths(months, selectedYear), [months, selectedYear]);

  async function loadPayslip(year, month) {
    if (!year || !month) { setSelected(null); return; }
    setPayslipLoading(true); setError("");
    try {
      const response = await fetch("/api/payslip", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ year, month }) });
      const data = await response.json();
      if (!response.ok || !data?.success) throw new Error(data?.error || "فیش قابل نمایش نیست.");
      setSelected(data.data?.[0] || data.payslip || null);
    } catch (err) { setSelected(null); setError(err.message || "خطا در دریافت فیش."); }
    finally { setPayslipLoading(false); }
  }

  useEffect(() => {
    let active = true;
    async function loadList() {
      setLoading(true); setError("");
      try {
        const response = await fetch("/api/payslip", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({}) });
        const data = await response.json();
        if (!response.ok || !data?.success) throw new Error(data?.error || "دریافت فیش‌ها انجام نشد.");
        if (!active) return;
        setEmployee(data.employee || null);
        const list = Array.isArray(data.months) ? [...data.months] : [];
        setMonths(list);
        const firstYear = getPayslipYears(list)[0] || "";
        const firstMonth = getAvailablePayslipMonths(list, firstYear)[0]?.month || "";
        setSelectedYear(firstYear); setSelectedMonth(String(firstMonth || ""));
      } catch (err) { if (active) setError(err.message || "خطا در دریافت فیش‌ها."); }
      finally { if (active) setLoading(false); }
    }
    loadList();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedYear) return;
    if (!availableMonths.some((item) => String(item.month) === String(selectedMonth))) setSelectedMonth(String(availableMonths[0]?.month || ""));
  }, [availableMonths, selectedMonth, selectedYear]);

  useEffect(() => {
    if (selectedYear && selectedMonth) loadPayslip(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  if (loading) return <main dir="rtl" className="min-h-screen bg-slate-950 px-4 py-24"><div className="mx-auto max-w-5xl rounded-3xl bg-white p-10 text-center text-sm font-black text-slate-700 shadow-2xl">در حال دریافت فیش حقوقی...</div></main>;

  if (selected) {
    const p = selected;
    const breakdown = buildPayslipBreakdown(p);
    const payYear = Number(p.year) ? Number(p.year).toLocaleString("fa-IR") : formatLabel(p.year);
    const payMonthNumber = Number(p.month);
    const payMonth = jalaliMonths[payMonthNumber - 1] || formatLabel(p.month);
    const payPeriodNumber = Number(p.period ?? p.pay_period ?? p.month);
    const payPeriod = Number.isFinite(payPeriodNumber) && payPeriodNumber > 0
      ? payPeriodNumber.toLocaleString("fa-IR")
      : formatLabel(p.period ?? p.pay_period ?? p.month);
    const employeeDetails = [
      ["نام و نام خانوادگی", p.full_name, "👤"], ["کد پرسنلی", p.personnel_code, "🪪"],
      ["عنوان شغلی", p.job_title || p.employee_job_title, "💼"], ["گروه مزدی", p.job_group, "🏷️"],
      ["واحد / دپارتمان", p.department, "🏢"], ["روزهای کارکرد", p.work_days, "📅"],
      ["روز مأموریت", p.mission_days, "🚗"], ["شماره حساب", p.bank_account, "💳"],
    ];

    return (
      <main dir="rtl" className="min-h-screen bg-[#f5f7fb] px-3 pb-12 pt-4 sm:px-5 sm:pt-7 print:bg-white print:p-0">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 print:hidden">
            <div><div className="text-[11px] font-black tracking-wide text-blue-700">سامانه حقوق و دستمزد</div><h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">فیش حقوقی من</h1></div>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black shadow-sm outline-none focus:border-blue-500">{years.map((year) => <option key={year} value={year}>{year}</option>)}</select>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black shadow-sm outline-none focus:border-blue-500">{availableMonths.map((item) => <option key={`${item.year}-${item.month}-${item.id || "payslip"}`} value={item.month}>{item.month}</option>)}</select>
            </div>
          </div>

          <article className="payslip-print-sheet overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)] print:rounded-none print:border-0 print:shadow-none">
            <header className="relative overflow-hidden bg-slate-950 px-5 py-7 text-white sm:px-8 sm:py-9">
              <div className="absolute -left-10 -top-16 h-52 w-52 rounded-full bg-blue-600/25 blur-3xl" />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-bold text-blue-100">{formatLabel(p.company_name)} • دوره {formatLabel(p.month)} {formatLabel(p.year)}</div>
                  <h2 className="text-2xl font-black tracking-tight sm:text-3xl">فیش حقوق و دستمزد</h2>
                  <div className="pay-period-box">
                    <div className="period-item">
                      <span className="period-label">سال پرداخت</span>
                      <strong>{payYear}</strong>
                    </div>
                    <div className="period-item">
                      <span className="period-label">ماه پرداخت</span>
                      <strong>{payMonth}</strong>
                    </div>
                    <div className="period-item">
                      <span className="period-label">دوره حقوق</span>
                      <strong>دوره {payPeriod}</strong>
                    </div>
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-300 sm:text-sm">{formatLabel(p.full_name)} • کد پرسنلی {formatLabel(p.personnel_code)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-5 py-4 shadow-inner backdrop-blur-sm sm:min-w-[285px]">
                  <div className="text-[10px] font-bold text-blue-200">خالص پرداختی</div>
                  <div className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">{toman(p.net_salary)}</div>
                  <div className="mt-1 text-[10px] font-semibold text-slate-300">{rial(p.net_salary)}</div>
                </div>
              </div>
            </header>

            <section className="border-b border-slate-200 bg-white px-4 py-5 sm:px-7">
              <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-black text-slate-900">مشخصات پرسنلی و کارکرد</h3><span className="rounded-full bg-blue-100 px-3 py-1 text-[9px] font-black text-blue-700">اطلاعات فیش</span></div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{employeeDetails.map(([label, value, icon]) => <Detail key={label} label={label} value={value} icon={icon} />)}</div>
            </section>

            <section className="grid gap-4 bg-[#f8fafc] p-4 sm:grid-cols-2 sm:p-7">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between bg-emerald-50 px-5 py-4"><div><div className="text-sm font-black text-emerald-950">پرداختی‌ها و مزایا</div><div className="mt-0.5 text-[9px] font-bold text-emerald-600">مزایای مشمول و غیرمشمول</div></div><span className="rounded-xl bg-white px-3 py-2 text-xs font-black text-emerald-700 shadow-sm">{toman(breakdown.totalPayments)}</span></div>
                {breakdown.payments.map((item) => <MoneyRow key={item.key} item={item} />)}
                <div className="flex items-center justify-between border-t border-emerald-200 bg-emerald-50/70 px-5 py-4"><span className="text-xs font-black text-emerald-950">جمع کل پرداختی‌ها</span><span className="text-sm font-black text-emerald-800">{toman(breakdown.totalPayments)}</span></div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between bg-rose-50 px-5 py-4"><div><div className="text-sm font-black text-rose-950">کسورات</div><div className="mt-0.5 text-[9px] font-bold text-rose-600">بیمه، مالیات و سایر کسورات</div></div><span className="rounded-xl bg-white px-3 py-2 text-xs font-black text-rose-700 shadow-sm">{toman(breakdown.totalDeductions)}</span></div>
                {breakdown.deductions.map((item) => <MoneyRow key={item.key} item={item} tone="red" />)}
                <div className="flex items-center justify-between border-t border-rose-200 bg-rose-50/70 px-5 py-4"><span className="text-xs font-black text-rose-950">جمع کل کسورات</span><span className="text-sm font-black text-rose-800">{toman(breakdown.totalDeductions)}</span></div>
              </div>
            </section>

            <section className="mx-4 mb-5 overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/60 sm:mx-7 sm:mb-7">
              <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><div className="text-[10px] font-black text-blue-600">مبلغ نهایی قابل واریز به حساب</div><div className="mt-1 text-2xl font-black tracking-tight text-blue-950 sm:text-3xl">{toman(p.net_salary)}</div></div><div className="rounded-xl bg-white px-4 py-3 text-xs font-black text-blue-800 shadow-sm ring-1 ring-blue-100">{rial(p.net_salary)}</div></div>
            </section>

            <footer className="flex flex-col gap-2 border-t border-slate-100 bg-white p-4 sm:flex-row sm:p-5 print:hidden">
              <button onClick={() => window.print()} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-slate-800">🖨 چاپ فیش</button>
              <Link href="/payslip/dashboard" className="rounded-xl bg-white px-5 py-3 text-center text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50">← بازگشت به پنل پرسنلی</Link>
              {payslipLoading && <div className="mr-auto self-center text-xs font-bold text-blue-600">در حال بروزرسانی فیش...</div>}
            </footer>
          <style jsx global>{`
@page { size: A5 portrait; margin: 8mm; }
.pay-period-box { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin:12px 0 10px; padding:10px; border:1px solid rgba(148,163,184,.45); border-radius:10px; background:rgba(255,255,255,.08); text-align:center; }
.period-item { min-width:0; padding:7px 4px; border-left:1px solid rgba(148,163,184,.35); }
.period-item:last-child { border-left:0; }
.period-label { display:block; margin-bottom:4px; color:#bfdbfe; font-size:11px; font-weight:700; }
.period-item strong { display:block; color:#fff; font-size:14px; font-weight:900; white-space:nowrap; }
@media print {
  html, body { width:148mm; min-width:148mm; margin:0; padding:0; background:#fff !important; }
  .payslip-print-sheet { width:100%; max-width:none !important; margin:0 !important; border:0 !important; border-radius:0 !important; box-shadow:none !important; overflow:visible !important; }
  .payslip-print-sheet header { padding:5mm 6mm !important; }
  .payslip-print-sheet .pay-period-box { display:grid !important; margin:3mm 0 4mm; padding:2mm; border:.3mm solid #b7c6d8; border-radius:2mm; background:#f1f5f9 !important; }
  .payslip-print-sheet .period-item { padding:1.5mm 1mm; border-left:.3mm solid #cbd5e1; }
  .payslip-print-sheet .period-item:last-child { border-left:0; }
  .payslip-print-sheet .period-label { margin-bottom:.8mm; color:#64748b !important; font-size:7pt; }
  .payslip-print-sheet .period-item strong { color:#1e3a5f !important; font-size:9pt; }
  .payslip-print-sheet header .absolute { display:none !important; }
  .payslip-print-sheet section { break-inside:avoid; }
  .payslip-print-sheet footer { display:none !important; }
}
`}</style>
          </article>
          {error && <div className="mt-3 rounded-2xl bg-rose-50 p-3 text-center text-xs font-bold text-rose-700">{error}</div>}
        </div>
      </main>
    );
  }

  return <main dir="rtl" className="min-h-screen bg-slate-100 px-4 py-20"><div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 text-center shadow-lg"><div className="text-sm font-black text-slate-900">فیش‌های حقوقی من</div><p className="mt-2 text-xs font-bold text-slate-500">{employee?.full_name || "کاربر گرامی"} — {months.length ? "فیش در حال آماده‌سازی است..." : "هنوز فیشی ثبت نشده است."}</p>{error && <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</div>}</div></main>;
}
