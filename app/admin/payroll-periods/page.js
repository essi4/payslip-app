"use client";

import { useEffect, useState } from "react";

export default function PayrollPeriodsPage() {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPeriods() {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/payroll-periods", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "خطا در دریافت دوره‌ها");
      setPeriods(result.data || []);
    } catch (err) {
      setError(err.message || "خطا در دریافت دوره‌ها");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPeriods();
  }, []);

  return (
    <main dir="rtl" className="min-h-screen bg-white p-6 text-gray-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">دوره‌های حقوق</h1>
            <p className="mt-1 text-sm text-gray-500">مدیریت دوره‌ها و مشاهده تعداد فیش‌های متصل</p>
          </div>
          <button onClick={loadPeriods} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
            بروزرسانی
          </button>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3">سال</th>
                <th className="px-4 py-3">ماه</th>
                <th className="px-4 py-3">شرکت</th>
                <th className="px-4 py-3">وضعیت</th>
                <th className="px-4 py-3">تعداد فیش</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500">در حال دریافت...</td></tr>
              ) : periods.length === 0 ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500">دوره‌ای ثبت نشده است.</td></tr>
              ) : periods.map((period) => (
                <tr key={period.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{period.year}</td>
                  <td className="px-4 py-3">{period.month}</td>
                  <td className="px-4 py-3">{period.company_id}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs text-green-700">{period.status}</span>
                  </td>
                  <td className="px-4 py-3">{period.payslip_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
