"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, RefreshCw, ArrowRight, FileText } from "lucide-react";

const monthNames = {
  1: "فروردین", 2: "اردیبهشت", 3: "خرداد", 4: "تیر", 5: "مرداد", 6: "شهریور",
  7: "مهر", 8: "آبان", 9: "آذر", 10: "دی", 11: "بهمن", 12: "اسفند",
};

function number(value) {
  return Number(value || 0).toLocaleString("fa-IR");
}

function money(value) {
  return `${number(value)} تومان`;
}

export default function PayrollPeriodsPage() {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadPeriods(refresh = false) {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError("");

      const response = await fetch("/api/payroll-periods", { cache: "no-store" });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "خطا در دریافت دوره‌های حقوق");
      }

      setPeriods(result.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPeriods();
  }, []);

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 bg-slate-900 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <Link href="/admin" className="mb-3 inline-flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white">
                <ArrowRight size={13} /> بازگشت به داشبورد
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-900">
                  <CalendarDays size={21} />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white">دوره‌های حقوق</h1>
                  <p className="mt-1 text-xs text-slate-300">سوابق دوره‌های دارای فیش حقوقی</p>
                </div>
              </div>
            </div>
            <button onClick={() => loadPeriods(true)} disabled={refreshing} className="flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 disabled:opacity-50">
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> بروزرسانی
            </button>
          </div>
        </section>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">{error}</div>}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <h2 className="text-sm font-black text-slate-900">دوره‌های ثبت‌شده</h2>
            <p className="mt-1 text-[11px] text-slate-500">تعداد فیش و مجموع خالص پرداختی هر ماه</p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs font-bold text-slate-500">در حال دریافت اطلاعات...</div>
          ) : periods.length === 0 ? (
            <div className="p-10 text-center">
              <CalendarDays className="mx-auto text-slate-300" size={34} />
              <p className="mt-3 text-sm font-bold text-slate-600">هنوز دوره حقوقی ثبت نشده است.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-right text-xs">
                <thead className="bg-slate-50 text-[11px] font-black text-slate-600">
                  <tr>
                    <th className="px-4 py-3">دوره حقوق</th>
                    <th className="px-4 py-3">تعداد فیش</th>
                    <th className="px-4 py-3">مجموع خالص پرداختی</th>
                    <th className="px-4 py-3">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((period) => (
                    <tr key={`${period.year}-${period.month}`} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-4 font-black text-slate-900">{monthNames[Number(period.month)] || `ماه ${period.month}`} {number(period.year)}</td>
                      <td className="px-4 py-4 font-bold text-slate-700">{number(period.payslip_count)} فیش</td>
                      <td className="px-4 py-4 font-black text-slate-900">{money(period.total_net_salary)}</td>
                      <td className="px-4 py-4">
                        <Link href={`/admin/payslips?year=${encodeURIComponent(period.year)}&month=${encodeURIComponent(period.month)}`} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-bold text-white hover:bg-slate-800">
                          <FileText size={13} /> مشاهده فیش‌ها
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
