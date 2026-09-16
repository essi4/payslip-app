"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

function money(value) {
  return Number(value || 0).toLocaleString("fa-IR") + " تومان";
}

function monthOrder(value) {
  const n = Number(value);
  if (Number.isFinite(n) && n >= 1 && n <= 12) return n;
  return MONTHS.indexOf(String(value || "").trim()) + 1;
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
    const deductions = Number(p.insurance || 0) + Number(p.tax || 0) + Number(p.other_deductions || 0);
    return (
      <main dir="rtl" className="min-h-screen bg-slate-100 px-3 pb-28 pt-28">
        <div className="mx-auto max-w-4xl rounded-[26px] bg-white shadow-xl">
          <div className="rounded-t-[26px] bg-gradient-to-l from-slate-950 to-blue-900 p-5 text-white">
            <button onClick={() => setSelected(null)} className="text-xs font-black text-blue-200">← بازگشت به فیش‌ها</button>
            <div className="mt-4 text-center text-xl font-black">فیش حقوق و دستمزد</div>
            <div className="mt-1 text-center text-xs text-blue-200">{p.month} {p.year}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 sm:p-6">
            {[["نام", p.full_name], ["کد پرسنلی", p.personnel_code], ["عنوان شغلی", p.job_title || p.employee_job_title], ["گروه مزدی", p.job_group], ["حقوق پایه", money(p.base_salary)], ["بیمه", money(p.insurance)]].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <div className="text-[9px] font-bold text-slate-400">{label}</div>
                <div className="mt-1 truncate text-xs font-black text-slate-800">{value || "—"}</div>
              </div>
            ))}
          </div>
          <div className="mx-4 mb-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-black">جمع مزایا و دریافت‌ها: {money(Number(p.base_salary || 0) + Number(p.overtime || 0) + Number(p.bonus || 0) + Number(p.housing_allowance || 0) + Number(p.food_allowance || 0) + Number(p.marriage_allowance || 0) + Number(p.child_allowance || 0) + Number(p.other_benefits || 0))}</div>
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-black">جمع کسورات: {money(deductions)}</div>
          </div>
          <div className="mx-4 mb-6 rounded-2xl bg-slate-950 p-5 text-center text-white">
            <div className="text-xs text-blue-200">خالص پرداختی</div>
            <div className="mt-1 text-3xl font-black">{money(p.net_salary)}</div>
          </div>
          <div className="px-4 pb-6">
            <button onClick={() => window.print()} className="w-full rounded-xl bg-blue-700 px-4 py-3 text-xs font-black text-white">🖨 چاپ فیش</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 pb-28 pt-28 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 rounded-[26px] bg-white p-5 shadow-sm">
          <div className="text-xs font-bold text-blue-700">پنل پرسنلی</div>
          <h1 className="mt-1 text-2xl font-black">خوش آمدید، {employee?.full_name || "کاربر گرامی"}</h1>
          <p className="mt-1 text-xs font-bold text-blue-700">شرکت: {employee?.company_name || "شرکت ثبت نشده"}</p>
        </div>

        <section className="mb-6 grid gap-3 sm:grid-cols-3">
          <Link href="/payslip/slips" className="rounded-2xl border border-blue-100 bg-white p-4 text-right shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="text-2xl">📄</div>
            <div className="mt-3 text-sm font-black text-slate-900">فیش‌های حقوقی من</div>
            <div className="mt-1 text-[10px] font-bold text-slate-500">مشاهده و چاپ فیش‌های حقوقی</div>
          </Link>
          <Link href="/payslip/order" className="rounded-2xl border border-violet-100 bg-white p-4 text-right shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="text-2xl">📝</div>
            <div className="mt-3 text-sm font-black text-slate-900">حکم کارگزینی</div>
            <div className="mt-1 text-[10px] font-bold text-slate-500">مشاهده اطلاعات حکم و مشخصات شغلی</div>
          </Link>
          <Link href="/payslip/account" className="rounded-2xl border border-emerald-100 bg-white p-4 text-right shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="text-2xl">👤</div>
            <div className="mt-3 text-sm font-black text-slate-900">حساب من</div>
            <div className="mt-1 text-[10px] font-bold text-slate-500">مشاهده اطلاعات حساب و مشخصات پرسنلی</div>
          </Link>
        </section>

        <div className="mb-5 rounded-[26px] bg-white p-5 shadow-sm">
          <div className="text-xs font-bold text-blue-700">فیش‌های حقوقی</div>
          <h2 className="mt-1 text-xl font-black">فیش‌های حقوقی من</h2>
          <p className="mt-1 text-xs font-bold text-slate-500">فیش‌ها از جدیدترین دوره مرتب شده‌اند.</p>
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
                <div className="mt-3 text-xs font-bold text-slate-500">خالص پرداختی: {money(item.net_salary)}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
