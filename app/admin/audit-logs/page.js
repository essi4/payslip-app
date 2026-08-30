"use client";

import { useEffect, useState } from "react";

const actionLabels = { CREATE: "ایجاد", UPDATE: "ویرایش", DELETE: "حذف", CLOSE: "بستن دوره", OPEN: "بازکردن دوره" };
const entityLabels = { payslip: "فیش حقوقی", payroll_period: "دوره حقوق" };

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLogs() {
    try {
      setLoading(true); setError("");
      const response = await fetch("/api/audit-logs?limit=200", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "خطا در دریافت لاگ‌ها");
      setLogs(result.data || []);
    } catch (err) { setError(err.message || "خطا در دریافت لاگ‌ها"); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadLogs(); }, []);

  return (
    <main dir="rtl" className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div><h1 className="text-2xl font-bold">🛡️ تاریخچه تغییرات</h1><p className="mt-1 text-sm text-gray-500">ثبت عملیات مهم روی فیش‌ها و دوره‌های حقوق</p></div>
          <button onClick={loadLogs} disabled={loading} className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50">بروزرسانی</button>
        </div>
        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-600"><tr><th className="px-4 py-3">زمان</th><th className="px-4 py-3">عملیات</th><th className="px-4 py-3">بخش</th><th className="px-4 py-3">شناسه</th><th className="px-4 py-3">دوره</th><th className="px-4 py-3">جزئیات</th></tr></thead>
            <tbody className="divide-y">
              {loading ? <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">در حال دریافت...</td></tr> : logs.length === 0 ? <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">هنوز تغییری ثبت نشده است.</td></tr> : logs.map((log) => <tr key={log.id} className="hover:bg-gray-50"><td className="whitespace-nowrap px-4 py-3">{new Date(log.created_at).toLocaleString("fa-IR")}</td><td className="px-4 py-3 font-bold">{actionLabels[log.action] || log.action}</td><td className="px-4 py-3">{entityLabels[log.entity_type] || log.entity_type}</td><td className="px-4 py-3">{log.entity_id ?? "—"}</td><td className="px-4 py-3">{log.payroll_period_id ?? "—"}</td><td className="max-w-md px-4 py-3 text-xs text-gray-600"><pre className="whitespace-pre-wrap font-sans">{JSON.stringify(log.details, null, 2)}</pre></td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
