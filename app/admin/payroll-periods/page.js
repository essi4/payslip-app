"use client";

import { useEffect, useState } from "react";

export default function PayrollPeriodsPage() {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ company_id: "1", year: "1405", month: "6" });

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

  async function createPeriod(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/payroll-periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: Number(form.company_id),
          year: Number(form.year),
          month: Number(form.month),
          status: "open",
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "خطا در ایجاد دوره");

      setMessage("دوره حقوق با موفقیت ایجاد شد.");
      await loadPeriods();
      setForm((current) => ({ ...current, month: String(Math.min(Number(current.month) + 1, 12)) }));
    } catch (err) {
      setError(err.message || "خطا در ایجاد دوره");
    } finally {
      setSaving(false);
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
            <p className="mt-1 text-sm text-gray-500">ایجاد و مدیریت دوره‌های حقوق و مشاهده تعداد فیش‌های متصل</p>
          </div>
          <button onClick={loadPeriods} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
            بروزرسانی
          </button>
        </div>

        <form onSubmit={createPeriod} className="mb-6 rounded-xl border bg-gray-50 p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">ایجاد دوره جدید</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block">شناسه شرکت</span>
              <input required type="number" min="1" value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })} className="w-full rounded-lg border bg-white px-3 py-2" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block">سال</span>
              <input required type="number" min="1300" max="1600" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full rounded-lg border bg-white px-3 py-2" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block">ماه</span>
              <input required type="number" min="1" max="12" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className="w-full rounded-lg border bg-white px-3 py-2" />
            </label>
          </div>
          <button disabled={saving} className="mt-4 rounded-lg bg-black px-5 py-2 text-sm text-white disabled:opacity-50">
            {saving ? "در حال ثبت..." : "ایجاد دوره"}
          </button>
        </form>

        {message && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}
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