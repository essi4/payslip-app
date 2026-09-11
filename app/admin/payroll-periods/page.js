"use client";

import { useEffect, useMemo, useState } from "react";

const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

export default function PayrollPeriodsPage() {
  const [periods, setPeriods] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ company_id: "", year: "1405", month: "6", start_date: "", end_date: "" });

  const companyMap = useMemo(() => Object.fromEntries(companies.map((c) => [String(c.id), c.name])), [companies]);
  const filteredPeriods = useMemo(() => {
    const q = query.trim().toLowerCase();
    return periods.filter((period) => {
      const matchesCompany = !companyId || String(period.company_id) === String(companyId);
      const matchesStatus = statusFilter === "all" || period.status === statusFilter;
      const companyName = companyMap[String(period.company_id)] || `شرکت ${period.company_id}`;
      const text = `${period.year} ${MONTHS[Number(period.month) - 1] || period.month} ${companyName}`.toLowerCase();
      return matchesCompany && matchesStatus && (!q || text.includes(q));
    });
  }, [periods, companyId, statusFilter, query, companyMap]);
  const stats = useMemo(() => ({ total: filteredPeriods.length, open: filteredPeriods.filter((p) => p.status !== "closed").length, closed: filteredPeriods.filter((p) => p.status === "closed").length, payslips: filteredPeriods.reduce((sum, p) => sum + Number(p.payslip_count || 0), 0) }), [filteredPeriods]);

  async function loadCompanies() {
    const response = await fetch("/api/companies", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || "خطا در دریافت شرکت‌ها");
    const list = Array.isArray(result.data) ? result.data : [];
    setCompanies(list);
    const first = list[0] ? String(list[0].id) : "";
    setCompanyId((current) => current || first);
    setForm((current) => ({ ...current, company_id: current.company_id || first }));
  }

  async function loadPeriods() {
    try {
      setLoading(true); setError("");
      const response = await fetch("/api/payroll-periods", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "خطا در دریافت دوره‌ها");
      setPeriods(Array.isArray(result.data) ? result.data : []);
    } catch (err) { setError(err.message || "خطا در دریافت دوره‌ها"); }
    finally { setLoading(false); }
  }

  async function createPeriod(event) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      if (!form.company_id) throw new Error("ابتدا شرکت را انتخاب کنید.");
      const response = await fetch("/api/payroll-periods", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company_id: Number(form.company_id), year: Number(form.year), month: Number(form.month), status: "open", start_date: form.start_date || null, end_date: form.end_date || null }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "خطا در ایجاد دوره");
      setMessage("🟢 دوره حقوق با موفقیت ایجاد شد.");
      setCompanyId(String(form.company_id));
      await loadPeriods();
      setForm((current) => ({ ...current, month: String(Math.min(Number(current.month) + 1, 12)), start_date: "", end_date: "" }));
    } catch (err) { setError(err.message || "خطا در ایجاد دوره"); }
    finally { setSaving(false); }
  }

  async function togglePeriod(period) {
    const nextStatus = period.status === "closed" ? "open" : "closed";
    const actionText = nextStatus === "closed" ? "بستن" : "بازکردن";
    const companyName = companyMap[String(period.company_id)] || `شرکت ${period.company_id}`;
    if (!window.confirm(`دوره ${MONTHS[Number(period.month) - 1] || period.month} ${period.year} برای «${companyName}» ${actionText} شود؟`)) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/payroll-periods", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: period.id, status: nextStatus }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || `خطا در ${actionText} دوره`);
      setMessage(`🟢 دوره با موفقیت ${nextStatus === "closed" ? "بسته" : "باز"} شد.`);
      await loadPeriods();
    } catch (err) { setError(err.message || `خطا در ${actionText} دوره`); }
    finally { setSaving(false); }
  }

  useEffect(() => { (async () => { try { await Promise.all([loadCompanies(), loadPeriods()]); } catch (err) { setError(err.message || "خطا در آماده‌سازی صفحه"); setLoading(false); } })(); }, []);

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-3 py-4 text-slate-900 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 rounded-2xl bg-gradient-to-l from-blue-700 to-indigo-700 p-5 text-white shadow-lg sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><div className="mb-2 text-sm font-semibold text-blue-100">PAYROLL CONTROL CENTER</div><h1 className="text-2xl font-black sm:text-3xl">دوره‌های حقوق</h1><p className="mt-2 text-sm text-blue-100">مدیریت چرخه ماهانه حقوق، وضعیت دوره‌ها و تعداد فیش‌های متصل</p></div>
            <button onClick={loadPeriods} disabled={loading || saving} className="rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold backdrop-blur hover:bg-white/25 disabled:opacity-50">↻ بروزرسانی</button>
          </div>
        </header>

        <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[['کل دوره‌ها', stats.total, '📅'], ['دوره باز', stats.open, '🟢'], ['دوره بسته', stats.closed, '🔒'], ['فیش‌های متصل', stats.payslips, '📄']].map(([label, value, icon]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-xl">{icon}</div><div className="mt-2 text-xs text-slate-500">{label}</div><div className="mt-1 text-2xl font-black text-slate-900">{Number(value).toLocaleString('fa-IR')}</div></div>)}
        </section>

        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4"><h2 className="text-lg font-black">➕ ایجاد دوره جدید</h2><p className="mt-1 text-xs text-slate-500">دوره برای شرکت انتخاب‌شده ساخته می‌شود و به‌صورت پیش‌فرض باز است.</p></div>
          <form onSubmit={createPeriod} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-sm font-bold lg:col-span-2"><span className="mb-2 block">شرکت</span><select required value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-blue-500">{companies.length === 0 && <option value="">شرکتی ثبت نشده</option>}{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="text-sm font-bold"><span className="mb-2 block">سال</span><input required type="number" min="1300" max="1600" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-blue-500" /></label>
            <label className="text-sm font-bold"><span className="mb-2 block">ماه</span><select required value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-blue-500">{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></label>
            <div className="flex items-end"><button disabled={saving || companies.length === 0} className="w-full rounded-xl bg-slate-900 px-4 py-3 font-black text-white hover:bg-slate-800 disabled:opacity-50">{saving ? 'در حال ثبت...' : 'ایجاد دوره'}</button></div>
          </form>
        </section>

        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-bold"><span className="mb-2 block">شرکت فعال</span><select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3"><option value="">همه شرکت‌ها</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="text-sm font-bold"><span className="mb-2 block">جستجوی دوره</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="سال، ماه یا نام شرکت..." className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-blue-500" /></label>
            <label className="text-sm font-bold"><span className="mb-2 block">وضعیت</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3"><option value="all">همه</option><option value="open">باز</option><option value="closed">بسته</option></select></label>
          </div>
        </section>

        {message && <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-bold text-green-700">{message}</div>}
        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">🔴 {error}</div>}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5"><div><h2 className="text-lg font-black">لیست دوره‌ها</h2><p className="mt-1 text-xs text-slate-500">{filteredPeriods.length.toLocaleString('fa-IR')} دوره مطابق فیلتر</p></div></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-right text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-4 py-3">سال</th><th className="px-4 py-3">ماه</th><th className="px-4 py-3">شرکت</th><th className="px-4 py-3">وضعیت</th><th className="px-4 py-3">فیش‌ها</th><th className="px-4 py-3">عملیات</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? <tr><td colSpan="6" className="px-4 py-12 text-center text-slate-500">در حال آماده‌سازی دوره‌ها...</td></tr> : filteredPeriods.length === 0 ? <tr><td colSpan="6" className="px-4 py-12 text-center"><div className="text-3xl">📭</div><div className="mt-2 font-bold text-slate-600">دوره‌ای مطابق فیلتر پیدا نشد</div></td></tr> : filteredPeriods.map((period) => {
                  const closed = period.status === 'closed';
                  return <tr key={period.id} className="hover:bg-slate-50"><td className="px-4 py-4 font-black">{period.year}</td><td className="px-4 py-4 font-semibold">{MONTHS[Number(period.month) - 1] || period.month}</td><td className="px-4 py-4 font-semibold">{companyMap[String(period.company_id)] || `شرکت ${period.company_id}`}</td><td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${closed ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{closed ? '🔒 بسته' : '🟢 باز'}</span></td><td className="px-4 py-4 font-black">{Number(period.payslip_count || 0).toLocaleString('fa-IR')}</td><td className="px-4 py-4"><button onClick={() => togglePeriod(period)} disabled={saving} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold hover:bg-slate-50 disabled:opacity-50">{closed ? 'بازکردن دوره' : 'بستن دوره'}</button></td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
