"use client";

import { useEffect, useState } from "react";

function value(value, fallback = "—") {
  return value === null || value === undefined || String(value).trim() === "" ? fallback : String(value);
}

export default function EmployeeOrderPage() {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/payslip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({}),
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || "نشست معتبر نیست.");
        setEmployee(result.employee);
      } catch (err) {
        setError(err.message || "نشست شما معتبر نیست.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function printOrder() {
    window.print();
  }

  if (loading) {
    return <main dir="rtl" className="min-h-screen bg-slate-100 p-4"><div className="mx-auto mt-12 max-w-2xl rounded-3xl bg-white p-10 text-center font-black text-slate-700 shadow-lg">در حال دریافت حکم کارگزینی...</div></main>;
  }

  if (!employee) {
    return <main dir="rtl" className="min-h-screen bg-slate-100 p-4"><div className="mx-auto mt-12 max-w-lg rounded-3xl border border-red-100 bg-white p-8 text-center shadow-lg"><div className="text-4xl">🔒</div><h1 className="mt-4 text-lg font-black text-slate-900">دسترسی به حکم کارگزینی</h1><p className="mt-2 text-sm font-bold text-red-600">{error || "نشست شما معتبر نیست."}</p><a href="/payslip" className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white">بازگشت به فیش‌ها</a></div></main>;
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 px-3 py-5 pb-28 md:px-5">
      <div className="mx-auto max-w-3xl">
        <header className="mb-4 overflow-hidden rounded-3xl bg-gradient-to-l from-slate-950 via-blue-950 to-slate-900 p-5 text-white shadow-xl md:p-7">
          <div className="text-[11px] font-bold text-blue-300">سیستم حقوق و دستمزد</div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl">📄</div>
            <div><h1 className="text-xl font-black md:text-2xl">حکم کارگزینی</h1><p className="mt-1 text-xs font-bold text-slate-300">مشاهده اطلاعات آخرین حکم ثبت‌شده برای شما</p></div>
          </div>
        </header>

        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl print:shadow-none">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 md:px-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <div><div className="text-[10px] font-bold text-slate-500">شماره حکم</div><div className="mt-1 text-sm font-black text-slate-950">{value(employee.last_order_number || employee.order_number)}</div></div>
              <div><div className="text-[10px] font-bold text-slate-500">تاریخ حکم</div><div className="mt-1 text-sm font-black text-slate-950">{value(employee.last_order_date || employee.order_date)}</div></div>
              <div><div className="text-[10px] font-bold text-slate-500">وضعیت</div><div className="mt-1 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">فعال</div></div>
            </div>
          </div>

          <div className="p-4 md:p-7">
            <div className="mb-5 text-center"><div className="text-xs font-bold text-blue-600">حکم کارگزینی کارکنان</div><h2 className="mt-1 text-xl font-black text-slate-950">مشخصات استخدامی و شغلی</h2></div>
            <div className="grid overflow-hidden rounded-2xl border border-slate-200 sm:grid-cols-2">
              <div className="border-b border-slate-200 p-4 sm:border-l"><div className="text-[10px] font-bold text-slate-500">نام و نام خانوادگی</div><div className="mt-1 text-sm font-black text-slate-950">{value(employee.full_name)}</div></div>
              <div className="border-b border-slate-200 p-4"><div className="text-[10px] font-bold text-slate-500">کد پرسنلی</div><div className="mt-1 text-sm font-black text-slate-950">{value(employee.personnel_code)}</div></div>
              <div className="border-b border-slate-200 p-4 sm:border-l"><div className="text-[10px] font-bold text-slate-500">کد ملی</div><div className="mt-1 text-sm font-black text-slate-950">{value(employee.national_id)}</div></div>
              <div className="border-b border-slate-200 p-4"><div className="text-[10px] font-bold text-slate-500">واحد سازمانی</div><div className="mt-1 text-sm font-black text-slate-950">{value(employee.department)}</div></div>
              <div className="border-b border-slate-200 p-4 sm:border-l"><div className="text-[10px] font-bold text-slate-500">عنوان شغلی</div><div className="mt-1 text-sm font-black text-slate-950">{value(employee.role || employee.job_title)}</div></div>
              <div className="border-b border-slate-200 p-4"><div className="text-[10px] font-bold text-slate-500">گروه مزدی</div><div className="mt-1 text-sm font-black text-slate-950">{value(employee.job_group)}</div></div>
              <div className="p-4 sm:border-l"><div className="text-[10px] font-bold text-slate-500">تاریخ استخدام</div><div className="mt-1 text-sm font-black text-slate-950">{value(employee.hire_date)}</div></div>
              <div className="p-4"><div className="text-[10px] font-bold text-slate-500">شرکت</div><div className="mt-1 text-sm font-black text-slate-950">{value(employee.company_name)}</div></div>
            </div>

            <div className="mt-6 rounded-2xl bg-blue-50 p-4 text-center text-xs font-bold leading-6 text-blue-900">این صفحه اطلاعات حکم کارگزینی ثبت‌شده برای حساب پرسنلی شما را نمایش می‌دهد.</div>

            <div className="no-print mt-6 grid gap-2 sm:grid-cols-2"><a href="/payslip" className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-xs font-black text-slate-700 transition hover:bg-slate-50">← فیش‌های حقوقی من</a><button type="button" onClick={printOrder} className="rounded-xl bg-blue-700 px-4 py-3 text-xs font-black text-white shadow transition hover:bg-blue-800">🖨 چاپ حکم</button></div>
          </div>
        </article>

        <footer className="py-6 text-center text-[10px] text-slate-500">© سیستم حقوق و دستمزد</footer>
      </div>
    </main>
  );
}
