"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buildPayslipBreakdown } from "../../lib/payslip-breakdown";

const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

function rial(value) {
  return `${Number(value || 0).toLocaleString("fa-IR")} ریال`;
}

function toman(value) {
  return `${Math.round(Number(value || 0) / 10).toLocaleString("fa-IR")} تومان`;
}

function monthOrder(value) {
  const n = Number(value);
  if (Number.isFinite(n) && n >= 1 && n <= 12) return n;
  return MONTHS.indexOf(String(value || "").trim()) + 1;
}

function formatLabel(value) {
  return String(value || "").trim() || "—";
}

function MoneyRow({ item, tone = "normal" }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-3 py-1.5 sm:px-4 sm:py-2">
      <span className="text-[10px] font-bold text-slate-600 sm:text-[11px]">{item.label}</span>
      <span className={`whitespace-nowrap text-[10px] font-black sm:text-[11px] ${tone === "red" ? "text-red-700" : "text-slate-900"}`}>
        {toman(item.amount)}
      </span>
    </div>
  );
}

export default function EmployeePayslipsPage() {
  const [months, setMonths] = useState([]);
  const [selected, setSelected] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadList() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/payslip", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({}) });
      const data = await response.json();
      if (!response.ok || !data?.success) throw new Error(data?.error || "دریافت فیش‌ها انجام نشد.");
      setEmployee(data.employee || null);
      const list = Array.isArray(data.months) ? [...data.months] : [];
      list.sort((a, b) => Number(b.year || 0) - Number(a.year || 0) || monthOrder(b.month) - monthOrder(a.month));
      setMonths(list);
    } catch (err) {
      setError(err.message || "خطا در دریافت فیش‌ها.");
    } finally {
      setLoading(false);
    }
  }

  async function openPayslip(item) {
    setError("");
    try {
      const response = await fetch("/api/payslip", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ month: item.month, year: item.year }) });
      const data = await response.json();
      if (!response.ok || !data?.success) throw new Error(data?.error || "فیش قابل نمایش نیست.");
      setSelected(data.data?.[0] || data.payslip || null);
    } catch (err) {
      setError(err.message || "خطا در دریافت فیش.");
    }
  }

  useEffect(() => { loadList(); }, []);

  if (selected) {
    const p = selected;
    const breakdown = buildPayslipBreakdown(p);
    const employeeDetails = [
      ["نام و نام خانوادگی", p.full_name],
      ["کد ملی", p.national_id],
      ["کد پرسنلی", p.personnel_code],
      ["واحد / دپارتمان", p.department],
      ["عنوان شغلی", p.job_title || p.employee_job_title],
      ["گروه مزدی", p.job_group],
      ["روزهای کارکرد", p.work_days],
      ["روز مأموریت", p.mission_days],
      ["ساعت مأموریت", p.mission_hours],
      ["شماره حساب", p.bank_account],
    ];

    return (
      <main dir="rtl" className="min-h-screen bg-slate-100 px-2 pb-24 pt-20 sm:px-4 sm:pt-24 print:min-h-0 print:bg-white print:p-0">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg print:max-w-none print:rounded-none print:border-0 print:shadow-none print:page">
          <header className="bg-slate-950 px-4 py-4 text-white sm:px-6 sm:py-5 print:px-5 print:py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold text-blue-200 sm:text-xs">{formatLabel(p.company_name)}</div>
                <h1 className="mt-1 text-xl font-black sm:text-2xl">فیش حقوق و دستمزد</h1>
                <div className="mt-1 text-[10px] font-bold text-slate-300 sm:text-xs">دوره پرداخت: {formatLabel(p.month)} {formatLabel(p.year)}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-left sm:px-4">
                <div className="text-[9px] font-bold text-blue-200">خالص پرداختی</div>
                <div className="mt-0.5 text-base font-black sm:text-lg">{toman(p.net_salary)}</div>
              </div>
            </div>
          </header>

          <section className="border-b border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-5 print:px-4 print:py-2 print:break-inside-avoid">
            <div className="mb-1.5 flex items-center justify-between">
              <h2 className="text-[11px] font-black text-slate-900 sm:text-xs">مشخصات پرسنلی و کارکرد</h2>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[8px] font-black text-blue-700">نسخه رسمی فیش</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
              {employeeDetails.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5">
                  <div className="text-[7px] font-bold text-slate-400">{label}</div>
                  <div className="mt-0.5 truncate text-[9px] font-black text-slate-800">{formatLabel(value)}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-3 p-3 sm:grid-cols-2 sm:p-5 print:grid-cols-2 print:gap-3 print:p-4 print:break-inside-avoid">
            <div className="overflow-hidden rounded-xl border border-emerald-200 bg-white">
              <div className="flex items-center justify-between bg-emerald-50 px-3 py-2">
                <div className="text-[11px] font-black text-emerald-950">پرداختی‌ها و مزایا</div>
                <div className="text-[9px] font-black text-emerald-700">{toman(breakdown.totalPayments)}</div>
              </div>
              {breakdown.payments.map((item) => <MoneyRow key={item.key} item={item} />)}
              <div className="flex items-center justify-between border-t border-emerald-200 bg-emerald-50/70 px-3 py-2 font-black text-emerald-950">
                <span className="text-[10px]">جمع کل پرداختی‌ها</span>
                <span className="text-[10px]">{toman(breakdown.totalPayments)}</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-red-200 bg-white">
              <div className="flex items-center justify-between bg-red-50 px-3 py-2">
                <div className="text-[11px] font-black text-red-950">کسورات</div>
                <div className="text-[9px] font-black text-red-700">{toman(breakdown.totalDeductions)}</div>
              </div>
              {breakdown.deductions.map((item) => <MoneyRow key={item.key} item={item} tone="red" />)}
              <div className="flex items-center justify-between border-t border-red-200 bg-red-50/70 px-3 py-2 font-black text-red-950">
                <span className="text-[10px]">جمع کل کسورات</span>
                <span className="text-[10px]">{toman(breakdown.totalDeductions)}</span>
              </div>
            </div>
          </section>

          <section className="mx-3 mb-3 rounded-xl bg-blue-700 px-4 py-3 text-white sm:mx-5 sm:mb-4 print:mx-4 print:mb-3 print:break-inside-avoid">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[9px] font-bold text-blue-100">خالص پرداختی قابل واریز</div>
                <div className="mt-0.5 text-xl font-black sm:text-2xl">{toman(p.net_salary)}</div>
              </div>
              <div className="text-left text-[9px] font-bold text-blue-100 sm:text-[10px]">{rial(p.net_salary)}</div>
            </div>
          </section>

          <footer className="flex gap-2 px-3 pb-4 sm:px-5 print:hidden">
            <button onClick={() => window.print()} className="flex-1 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white">🖨 چاپ فیش</button>
            <button onClick={() => setSelected(null)} className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-black text-slate-700">← بازگشت به فیش‌ها</button>
          </footer>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 pb-28 pt-28 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 rounded-[26px] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-blue-700">فیش‌های حقوقی</div>
              <h1 className="mt-1 text-2xl font-black">فیش‌های حقوقی من</h1>
              <p className="mt-1 text-xs font-bold text-slate-500">{employee?.full_name || "کاربر گرامی"} — فیش‌ها از جدیدترین دوره مرتب شده‌اند.</p>
            </div>
            <Link href="/payslip/dashboard" className="rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-black text-slate-700">← پنل پرسنلی</Link>
          </div>
        </div>
        {error && <div className="mb-4 rounded-2xl bg-red-50 p-3 text-center text-xs font-bold text-red-700">{error}</div>}
        {loading ? <div className="rounded-2xl bg-white p-8 text-center text-sm font-bold">در حال دریافت فیش‌ها...</div> : months.length === 0 ? <div className="rounded-2xl bg-white p-8 text-center text-sm font-bold text-slate-500">هنوز فیشی ثبت نشده است.</div> : (
          <div className="grid gap-3 sm:grid-cols-2">
            {months.map((item) => (
              <button key={`${item.year}-${item.month}-${item.id || "payslip"}`} onClick={() => openPayslip(item)} className="rounded-2xl border border-slate-200 bg-white p-4 text-right shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900">📄 فیش {item.month} {item.year}</span>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[9px] font-black text-blue-700">مشاهده ←</span>
                </div>
                <div className="mt-3 text-xs font-bold text-slate-500">خالص پرداختی: {toman(item.net_salary)}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
