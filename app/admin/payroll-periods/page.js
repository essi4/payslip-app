"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, RefreshCw, ArrowRight, FileText, Plus, Lock, Unlock } from "lucide-react";

const monthNames = ["", "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

function number(value) { return Number(value || 0).toLocaleString("fa-IR"); }
function money(value) { return `${number(value)} تومان`; }

export default function PayrollPeriodsPage() {
  const [periods, setPeriods] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company_id: "", year: "1405", month: "1", start_date: "", end_date: "" });

  async function request(url, options) {
    const response = await fetch(url, { cache: "no-store", ...options });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) throw new Error(result.error || "خطا در ارتباط با سامانه");
    return result;
  }

  async function loadData(refresh = false) {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError("");
      const [periodResult, companyResult] = await Promise.all([
        request("/api/payroll-periods"),
        request("/api/companies"),
      ]);
      setPeriods(periodResult.data || []);
      setCompanies(companyResult.data || []);
      if (!form.company_id && companyResult.data?.[0]) setForm((x) => ({ ...x, company_id: String(companyResult.data[0].id) }));
    } catch (err) {
      console.error(err);
      setError(err.message || "خطا در دریافت اطلاعات");
    } finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { loadData(); }, []);

  async function createPeriod(e) {
    e.preventDefault();
    try {
      setSaving(true); setError(""); setMessage("");
      await request("/api/payroll-periods", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setMessage("دوره حقوق با موفقیت ایجاد شد.");
      setShowForm(false);
      await loadData(true);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function togglePeriod(period) {
    const nextStatus = period.status === "closed" ? "open" : "closed";
    if (nextStatus === "closed" && !window.confirm("دوره بسته شود؟ پس از بستن، صدور یا تغییر فیش‌های این دوره باید کنترل شود.")) return;
    try {
      setError(""); setMessage("");
      await request("/api/payroll-periods", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: period.id, status: nextStatus }) });
      setMessage(nextStatus === "closed" ? "دوره بسته شد." : "دوره دوباره باز شد.");
      await loadData(true);
    } catch (err) { setError(err.message); }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 bg-slate-900 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <Link href="/admin" className="mb-3 inline-flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white"><ArrowRight size={13} /> بازگشت به داشبورد</Link>
              <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-900"><CalendarDays size={21} /></div><div><h1 className="text-xl font-black text-white">دوره‌های حقوق</h1><p className="mt-1 text-xs text-slate-300">مدیریت دوره‌های حقوق، شرکت‌ها و فیش‌های هر دوره</p></div></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => loadData(true)} disabled={refreshing} className="flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 disabled:opacity-50"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> بروزرسانی</button>
              <button onClick={() => { setShowForm((x) => !x); setError(""); }} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500"><Plus size={14} /> ایجاد دوره</button>
            </div>
          </div>
        </section>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">{error}</div>}
        {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">{message}</div>}

        {showForm && <form onSubmit={createPeriod} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4"><h2 className="text-sm font-black text-slate-900">ایجاد دوره حقوق جدید</h2><p className="mt-1 text-[11px] text-slate-500">هر شرکت در هر سال و ماه فقط یک دوره دارد.</p></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-xs font-bold text-slate-700">شرکت<select value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })} required className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs"><option value="">انتخاب شرکت</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="text-xs font-bold text-slate-700">سال<input type="number" min="1300" max="1600" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" /></label>
            <label className="text-xs font-bold text-slate-700">ماه<select value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs">{monthNames.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}</select></label>
            <label className="text-xs font-bold text-slate-700">تاریخ شروع<input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" /></label>
            <label className="text-xs font-bold text-slate-700">تاریخ پایان<input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" /></label>
          </div>
          <div className="mt-4 flex justify-end"><button disabled={saving} className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving ? "در حال ثبت..." : "ثبت دوره"}</button></div>
        </form>}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4 sm:p-5"><h2 className="text-sm font-black text-slate-900">دوره‌های ثبت‌شده</h2><p className="mt-1 text-[11px] text-slate-500">تعداد فیش، وضعیت و مجموع خالص پرداختی هر دوره</p></div>
          {loading ? <div className="p-8 text-center text-xs font-bold text-slate-500">در حال دریافت اطلاعات...</div> : periods.length === 0 ? <div className="p-10 text-center"><CalendarDays className="mx-auto text-slate-300" size={34} /><p className="mt-3 text-sm font-bold text-slate-600">هنوز دوره حقوقی ثبت نشده است.</p></div> :
            <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-right text-xs"><thead className="bg-slate-50 text-[11px] font-black text-slate-600"><tr><th className="px-4 py-3">شرکت</th><th className="px-4 py-3">دوره</th><th className="px-4 py-3">وضعیت</th><th className="px-4 py-3">تعداد فیش</th><th className="px-4 py-3">مجموع خالص</th><th className="px-4 py-3">عملیات</th></tr></thead><tbody>{periods.map((period) => <tr key={period.id || `${period.year}-${period.month}`} className="border-t border-slate-100 hover:bg-slate-50"><td className="px-4 py-4 font-bold text-slate-700">{period.company_name || "—"}</td><td className="px-4 py-4 font-black text-slate-900">{monthNames[Number(period.month)] || `ماه ${period.month}`} {number(period.year)}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${period.status === "closed" ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-700"}`}>{period.status === "closed" ? "بسته" : "باز"}</span></td><td className="px-4 py-4 font-bold">{number(period.payslip_count)} فیش</td><td className="px-4 py-4 font-black">{money(period.total_net_salary)}</td><td className="px-4 py-4"><div className="flex flex-wrap gap-2"><Link href={`/admin/payslips?year=${encodeURIComponent(period.year)}&month=${encodeURIComponent(period.month)}`} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-bold text-white"><FileText size={13} /> فیش‌ها</Link><button onClick={() => togglePeriod(period)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-700">{period.status === "closed" ? <Unlock size={13} /> : <Lock size={13} />}{period.status === "closed" ? "باز کردن" : "بستن دوره"}</button></div></td></tr>)}</tbody></table></div>}
        </section>
      </div>
    </main>
  );
}
