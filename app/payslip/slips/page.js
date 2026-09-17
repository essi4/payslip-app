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
      const response = await fetch("/api/payslip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({}),
      });
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
      const response = await fetch("/api/payslip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ month: item.month, year: item.year }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) throw new Error(data?.error || "فیش قابل نمایش نیست.");
      setSelected(data.data?.[0] || data.payslip || null);
    } catch (err) {
      setError(err.message || "خطا در دریافت فیش.");
    }
  }

  useEffect(() => {
    loadList();
  }, []);

  if (selected) {
    const p = selected;
    const breakdown = buildPayslipBreakdown(p);

    return (
      <main dir="rtl" className="min-h-screen bg-slate-100 px-3 pb-28 pt-24 sm:px-6 sm:pt-28 print:bg-white print:px-0 print:pt-0">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-xl print:max-w-none print:rounded-none print:shadow-none">
          <header className="bg-gradient-to-l from-slate-950 via-blue-950 to-blue-800 p-5 text-white sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-blue-200">{formatLabel(p.company_name)}</div>
                <h1 className="mt-2 text-2xl font-black sm:text-3xl">فیش حقوق و دستمزد</h1>
                <div className="mt-1 text-sm font-bold text-blue-100">{formatLabel(p.month)} {formatLabel(p.year)}</div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-left backdrop-blur">
                <div className="text-[10px] font-bold text-blue-200">خالص پرداختی</div>
                <div className="mt-1 text-lg font-black">{toman(p.net_salary)}</div>
              </div>
            </div>
          </header>

          <section className="grid gap-2 border-b border-slate-100 bg-slate-50 p-4 sm:grid-cols-4 sm:p-5">
            {[
              ["نام و نام خانوادگی", p.full_name],
              ["کد پرسنلی", p.personnel_code],
              ["عنوان شغلی", p.job_title || p.employee_job_title],
              ["گروه مزدی", p.job_group],
              ["واحد / دپارتمان", p.department],
              ["روزهای کارکرد", p.work_days],
              ["روز مأموریت", p.mission_days],
              ["شماره حساب", p.bank_account],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-[9px] font-bold text-slate-400">{label}</div>
                <div className="mt-1 truncate text-xs font-black text-slate-800">{formatLabel(value)}</div>
              </div>
            ))}
          </section>

          <section className="grid gap-5 p-4 sm:p-6 lg:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-emerald-100">
              <div className="flex items-center justify-between bg-emerald-50 px-4 py-3">
                <div className="font-black text-emerald-900">پرداختی‌ها و مزایا</div>
                <div className="text-xs font-black text-emerald-700">{toman(breakdown.totalPayments)}</div>
              </div>
              <div className="divide-y divide-slate-100">
                {breakdown.payments.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="text-xs font-bold text-slate-600">{item.label}</span>
                    <span className="text-left text-xs font-black text-slate-900">
                      {toman(item.amount)}
                      <span className="mt-0.5 block text-[9px] font-bold text-slate-400">{rial(item.amount)}</span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-emerald-100 bg-emerald-50/70 px-4 py-4">
                <div className="flex items-center justify-between font-black text-emerald-950">
                  <span>جمع کل پرداختی‌ها</span>
                  <span>{toman(breakdown.totalPayments)}</span>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-red-100">
              <div className="flex items-center justify-between bg-red-50 px-4 py-3">
                <div className="font-black text-red-900">کسورات</div>
                <div className="text-xs font-black text-red-700">{toman(breakdown.totalDeductions)}</div>
              </div>
              <div className="divide-y divide-slate-100">
                {breakdown.deductions.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="text-xs font-bold text-slate-600">{item.label}</span>
                    <span className="text-left text-xs font-black text-red-700">
                      {toman(item.amount)}
                      <span className="mt-0.5 block text-[9px] font-bold text-slate-400">{rial(item.amount)}</span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-red-100 bg-red-50/70 px-4 py-4">
                <div className="flex items-center justify-between font-black text-red-950">
                  <span>جمع کل کسورات</span>
                  <span>{toman(breakdown.totalDeductions)}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-4 mb-5 rounded-2xl bg-slate-950 p-5 text-white sm:mx-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-bold text-blue-200">خالص پرداختی ماه {formatLabel(p.month)}</div>
                <div className="mt-1 text-3xl font-black">{toman(p.net_salary)}</div>
              </div>
              <div className="text-left text-xs font-bold text-slate-300">{rial(p.net_salary)}</div>
            </div>
          </section>

          <footer className="flex flex-col gap-2 px-4 pb-6 sm:flex-row sm:px-6 print:hidden">
            <button onClick={() => window.print()} className="flex-1 rounded-xl bg-blue-700 px-4 py-3 text-xs font-black text-white">🖨 چاپ فیش</button>
            <button onClick={() => setSelected(null)} className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-xs font-black text-slate-700">← بازگشت به فیش‌ها</button>
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
