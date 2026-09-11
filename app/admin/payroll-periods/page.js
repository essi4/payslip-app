"use client";

import { useEffect, useMemo, useState } from "react";

const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

export default function PayrollPeriodsPage() {
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [periods, setPeriods] = useState([]);
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ year: "1405", month: "6", start_date: "", end_date: "" });

  const companyName = useMemo(() => companies.find((c) => String(c.id) === String(companyId))?.name || "", [companies, companyId]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return periods.filter((p) => {
      const text = `${p.year} ${MONTHS[Number(p.month) - 1] || p.month}`.toLowerCase();
      return (status === "all" || p.status === status) && (!q || text.includes(q));
    });
  }, [periods, status, query]);
  const stats = useMemo(() => ({
    total: filtered.length,
    open: filtered.filter((p) => p.status !== "closed").length,
    closed: filtered.filter((p) => p.status === "closed").length,
    payslips: filtered.reduce((sum, p) => sum + Number(p.payslip_count || 0), 0),
  }), [filtered]);

  async function loadCompanies() {
    const r = await fetch("/api/companies", { cache: "no-store" });
    const j = await r.json();
    if (!r.ok || !j.success) throw new Error(j.error || "خطا در دریافت شرکت‌ها");
    const list = Array.isArray(j.data) ? j.data : [];
    setCompanies(list);
    if (!companyId && list[0]) setCompanyId(String(list[0].id));
  }

  async function loadPeriods(id = companyId) {
    if (!id) { setPeriods([]); setLoading(false); return; }
    try {
      setLoading(true); setError("");
      const r = await fetch(`/api/payroll-periods?company_id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.error || "خطا در دریافت دوره‌ها");
      setPeriods(Array.isArray(j.data) ? j.data : []);
    } catch (e) { setError(e.message || "خطا در دریافت دوره‌ها"); }
    finally { setLoading(false); }
  }

  async function createPeriod(e) {
    e.preventDefault();
    if (!companyId) return setError("ابتدا شرکت را انتخاب کنید.");
    setSaving(true); setError(""); setMessage("");
    try {
      const r = await fetch("/api/payroll-periods", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: Number(companyId), year: Number(form.year), month: Number(form.month), status: "open", start_date: form.start_date || null, end_date: form.end_date || null }),
      });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.error || "خطا در ایجاد دوره");
      setMessage(`🟢 دوره ${MONTHS[Number(form.month) - 1]} ${form.year} برای «${companyName}» ایجاد شد.`);
      await loadPeriods(companyId);
      setForm((f) => ({ ...f, month: String(Math.min(Number(f.month) + 1, 12)), start_date: "", end_date: "" }));
    } catch (e) { setError(e.message || "خطا در ایجاد دوره"); }
    finally { setSaving(false); }
  }

  async function togglePeriod(period) {
    const next = period.status === "closed" ? "open" : "closed";
    const label = MONTHS[Number(period.month) - 1] || period.month;
    if (!window.confirm(`دوره ${label} ${period.year} برای «${companyName}» ${next === "closed" ? "بسته" : "باز"} شود؟`)) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const r = await fetch("/api/payroll-periods", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: period.id, company_id: Number(companyId), status: next }) });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.error || "خطا در تغییر وضعیت دوره");
      setMessage(`🟢 دوره ${label} ${period.year} ${next === "closed" ? "بسته" : "باز"} شد.`);
      await loadPeriods(companyId);
    } catch (e) { setError(e.message || "خطا در تغییر وضعیت دوره"); }
    finally { setSaving(false); }
  }

  useEffect(() => { loadCompanies().catch((e) => { setError(e.message); setLoading(false); }); }, []);
  useEffect(() => { if (companyId) loadPeriods(companyId); }, [companyId]);

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-3 py-4 text-slate-900 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 rounded-2xl bg-gradient-to-l from-blue-700 to-indigo-700 p-5 text-white shadow-lg sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><div className="mb-2 text-xs font-bold text-blue-100">PAYROLL CONTROL CENTER · COMPANY SCOPED</div><h1 className="text-2xl font-black sm:text-3xl">دوره‌های حقوق</h1><p className="mt-2 text-sm text-blue-100">هر شرکت چرخه حقوق مستقل خودش را دارد.</p></div>
            <button onClick={() => loadPeriods()} disabled={loading || saving} className="rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold hover:bg-white/25 disabled:opacity-50">↻ بروزرسانی</button>
          </div>
        </header>

        <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[["کل دوره‌ها", stats.total, "📅"], ["باز", stats.open, "🟢"], ["بسته", stats.closed, "🔒"], ["فیش‌های متصل", stats.payslips, "📄"]].map(([label, value, icon]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-xl">{icon}</div><div className="mt-2 text-xs text-slate-500">{label}</div><div className="mt-1 text-2xl font-black">{Number(value).toLocaleString("fa-IR")}</div></div>)}
        </section>

        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4"><h2 className="text-lg font-black">➕ ایجاد دوره جدید</h2><p className="mt-1 text-xs text-slate-500">دوره فقط برای شرکت فعال ساخته می‌شود.</p></div>
          <form onSubmit={createPeriod} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <label className="text-sm font-bold lg:col-span-2"><span className="mb-2 block">شرکت فعال</span><select required value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3">{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="text-sm font-bold"><span className="mb-2 block">سال</span><input required type="number" min="1300" max="1600" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-3" /></label>
            <label className="text-sm font-bold"><span className="mb-2 block">ماه</span><select required value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3">{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></label>
            <label className="text-sm font-bold"><span className="mb-2 block">شروع میلادی</span><input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-3" /></label>
            <label className="text-sm font-bold"><span className="mb-2 block">پایان میلادی</span><input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-3" /></label>
            <button disabled={saving || !companyId} className="rounded-xl bg-slate-900 px-4 py-3 font-black text-white hover:bg-slate-800 disabled:opacity-50 lg:col-span-6">{saving ? "در حال ثبت..." : "ایجاد دوره حقوق"}</button>
          </form>
        </section>

        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-bold"><span className="mb-2 block">شرکت فعال</span><select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3">{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="text-sm font-bold"><span className="mb-2 block">جستجو</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="سال یا ماه..." className="w-full rounded-xl border border-slate-300 px-3 py-3" /></label>
            <label className="text-sm font-bold"><span className="mb-2 block">وضعیت</span><select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3"><option value="all">همه</option><option value="open">باز</option><option value="closed">بسته</option></select></label>
          </div>
        </section>

        {message && <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-bold text-green-700">{message}</div>}
        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">🔴 {error}</div>}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4 sm:p-5"><h2 className="text-lg font-black">لیست دوره‌های {companyName || "شرکت"}</h2><p className="mt-1 text-xs text-slate-500">{filtered.length.toLocaleString("fa-IR")} دوره مطابق فیلتر</p></div>
          <div className="hidden overflow-x-auto sm:block"><table className="w-full min-w-[760px] text-right text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-4 py-3">سال</th><th className="px-4 py-3">ماه</th><th className="px-4 py-3">شروع</th><th className="px-4 py-3">پایان</th><th className="px-4 py-3">وضعیت</th><th className="px-4 py-3">فیش‌ها</th><th className="px-4 py-3">عملیات</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan="7" className="px-4 py-12 text-center text-slate-500">در حال بارگذاری...</td></tr> : filtered.map((p) => <tr key={p.id} className="hover:bg-slate-50"><td className="px-4 py-4 font-black">{p.year}</td><td className="px-4 py-4 font-bold">{MONTHS[Number(p.month) - 1] || p.month}</td><td className="px-4 py-4 text-xs text-slate-500">{p.start_date || "—"}</td><td className="px-4 py-4 text-xs text-slate-500">{p.end_date || "—"}</td><td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${p.status === "closed" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{p.status === "closed" ? "🔒 بسته" : "🟢 باز"}</span></td><td className="px-4 py-4 font-black">{Number(p.payslip_count || 0).toLocaleString("fa-IR")}</td><td className="px-4 py-4"><button onClick={() => togglePeriod(p)} disabled={saving} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold hover:bg-slate-50 disabled:opacity-50">{p.status === "closed" ? "بازکردن" : "بستن"}</button></td></tr>)}</tbody></table></div>
          <div className="space-y-3 p-3 sm:hidden">{loading ? <div className="p-8 text-center text-slate-500">در حال بارگذاری...</div> : filtered.length === 0 ? <div className="p-8 text-center text-slate-500">📭 دوره‌ای پیدا نشد</div> : filtered.map((p) => <article key={p.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><div className="text-lg font-black">{MONTHS[Number(p.month) - 1] || p.month} {p.year}</div><div className="mt-1 text-xs text-slate-500">{companyName}</div></div><span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${p.status === "closed" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{p.status === "closed" ? "🔒 بسته" : "🟢 باز"}</span></div><div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-slate-50 p-3"><div className="text-slate-500">شروع</div><div className="mt-1 font-bold">{p.start_date || "—"}</div></div><div className="rounded-xl bg-slate-50 p-3"><div className="text-slate-500">پایان</div><div className="mt-1 font-bold">{p.end_date || "—"}</div></div><div className="rounded-xl bg-slate-50 p-3"><div className="text-slate-500">فیش‌ها</div><div className="mt-1 font-black">{Number(p.payslip_count || 0).toLocaleString("fa-IR")}</div></div><button onClick={() => togglePeriod(p)} disabled={saving} className="rounded-xl bg-slate-900 p-3 font-black text-white disabled:opacity-50">{p.status === "closed" ? "بازکردن دوره" : "بستن دوره"}</button></div></article>)}</div>
        </section>
      </div>
    </main>
  );
}
