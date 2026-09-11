"use client";

import { useEffect, useMemo, useState } from "react";

const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const RATE = 16667;
const HOURS = 7.33;

function n(v) { const x = Number(v); return Number.isFinite(x) ? x : 0; }
function money(v) { return n(v).toLocaleString("fa-IR"); }

export default function BulkPayslipsPage() {
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [periods, setPeriods] = useState([]);
  const [periodId, setPeriodId] = useState("");
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState([]);
  const [baseSalary, setBaseSalary] = useState("");
  const [workDays, setWorkDays] = useState("30");
  const [missionDays, setMissionDays] = useState("0");
  const [missionHours, setMissionHours] = useState("0");
  const [seniority, setSeniority] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const company = useMemo(() => companies.find((x) => String(x.id) === String(companyId)), [companies, companyId]);
  const period = useMemo(() => periods.find((x) => String(x.id) === String(periodId)), [periods, periodId]);
  const selectedEmployees = useMemo(() => employees.filter((x) => selected.includes(Number(x.id))), [employees, selected]);
  const daily = n(baseSalary) / Math.max(1, n(workDays));
  const hourly = daily / HOURS;
  const mission = n(missionDays) * daily + n(missionHours) * hourly;
  const seniorityAmount = seniority ? n(workDays) * RATE : 0;
  const estimatedNet = n(baseSalary) + mission + seniorityAmount;

  async function loadCompanies() {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/companies", { cache: "no-store" });
      const d = await r.json(); if (!r.ok || !d.success) throw new Error(d.error || "خطا در شرکت‌ها");
      setCompanies(Array.isArray(d.data) ? d.data : []);
      if (d.data?.length) setCompanyId(String(d.data[0].id));
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  async function loadPeriods(id) {
    if (!id) { setPeriods([]); setPeriodId(""); return; }
    try {
      const r = await fetch(`/api/payroll-periods?company_id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const d = await r.json(); if (!r.ok || !d.success) throw new Error(d.error || "خطا در دوره‌ها");
      const open = (d.data || []).filter((x) => x.status === "open");
      setPeriods(open); setPeriodId(open.length ? String(open[0].id) : "");
    } catch (e) { setPeriods([]); setPeriodId(""); setError(e.message); }
  }

  async function loadEmployees(id) {
    if (!id) { setEmployees([]); setSelected([]); return; }
    try {
      const r = await fetch(`/api/personnel?company_id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const d = await r.json(); if (!r.ok || !d.success) throw new Error(d.error || "خطا در کارکنان");
      const list = Array.isArray(d.data) ? d.data : [];
      setEmployees(list); setSelected([]);
    } catch (e) { setEmployees([]); setSelected([]); setError(e.message); }
  }

  useEffect(() => { loadCompanies(); }, []);
  useEffect(() => { loadPeriods(companyId); loadEmployees(companyId); }, [companyId]);

  function toggle(id) { setSelected((old) => old.includes(id) ? old.filter((x) => x !== id) : [...old, id]); }
  function selectAll() { setSelected(selected.length === employees.length ? [] : employees.map((x) => Number(x.id))); }

  async function submit() {
    setMessage(""); setError(""); setResult(null);
    if (!companyId || !periodId) return setError("ابتدا شرکت و یک دوره باز را انتخاب کنید.");
    if (!selected.length) return setError("حداقل یک کارمند را انتخاب کنید.");
    if (n(baseSalary) <= 0) return setError("حقوق پایه باید بیشتر از صفر باشد.");
    setSaving(true);
    try {
      const r = await fetch("/api/payslips/bulk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: Number(companyId), payroll_period_id: Number(periodId), employee_ids: selected,
          year: period.year, month: period.month,
          defaults: { base_salary: n(baseSalary), work_days: n(workDays), mission_days: n(missionDays), mission_hours: n(missionHours), seniority_eligible: seniority },
        }),
      });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || "صدور گروهی ناموفق بود");
      setResult(d.summary); setMessage(d.message); setSelected([]);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  if (loading) return <main dir="rtl" className="min-h-screen bg-slate-100 p-4 md:p-8"><div className="mx-auto max-w-6xl rounded-3xl bg-white p-10 text-center shadow-sm"><div className="text-5xl">📄</div><h1 className="mt-4 text-xl font-black">در حال آماده‌سازی صدور گروهی...</h1></div></main>;

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 p-3 md:p-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="rounded-3xl bg-gradient-to-l from-slate-950 via-blue-950 to-slate-900 p-5 text-white shadow-xl md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div><div className="text-xs font-bold text-blue-200">PAYROLL PRO</div><h1 className="mt-1 text-2xl font-black">صدور گروهی فیش حقوقی</h1><p className="mt-2 text-xs leading-6 text-slate-300">یک دوره را انتخاب کن، کارکنان را انتخاب کن و فیش‌ها را یکجا و امن صادر کن.</p></div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-center"><div className="text-[10px] text-blue-200">انتخاب‌شده</div><div className="text-2xl font-black">{selected.length.toLocaleString("fa-IR")}</div><div className="text-[10px] text-slate-300">کارمند</div></div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black text-slate-950">🏢 شرکت و دوره</h2>
            <div className="mt-4 space-y-3">
              <div><label className="mb-1.5 block text-xs font-bold text-slate-600">شرکت</label><select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"><option value="">انتخاب شرکت...</option>{companies.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
              <div><label className="mb-1.5 block text-xs font-bold text-slate-600">دوره حقوق باز</label><select value={periodId} onChange={(e) => setPeriodId(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"><option value="">دوره باز نداریم</option>{periods.map((x) => <option key={x.id} value={x.id}>{x.month} {x.year} · {x.payslip_count || 0} فیش</option>)}</select></div>
              {period && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">🟢 دوره باز است؛ صدور فیش جدید مجاز است.</div>}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black text-slate-950">⚙️ محاسبه مشترک</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="text-xs font-bold text-slate-600">حقوق پایه<input value={baseSalary} onChange={(e) => setBaseSalary(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder="مثلاً 250000000" className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-black outline-none focus:border-blue-500"/></label>
              <label className="text-xs font-bold text-slate-600">روز کارکرد<input value={workDays} onChange={(e) => setWorkDays(e.target.value)} inputMode="numeric" className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-black outline-none focus:border-blue-500"/></label>
              <label className="text-xs font-bold text-slate-600">روز مأموریت<input value={missionDays} onChange={(e) => setMissionDays(e.target.value)} inputMode="numeric" className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-black outline-none focus:border-blue-500"/></label>
              <label className="text-xs font-bold text-slate-600">ساعت مأموریت<input value={missionHours} onChange={(e) => setMissionHours(e.target.value)} inputMode="numeric" className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-black outline-none focus:border-blue-500"/></label>
            </div>
            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl bg-amber-50 p-3 text-xs font-black text-amber-900"><input type="checkbox" checked={seniority} onChange={(e) => setSeniority(e.target.checked)} className="h-4 w-4"/> مشمول پایه سنوات</label>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center text-[10px] font-bold"><div className="rounded-2xl bg-slate-100 p-3">مزد روزانه<strong className="mt-1 block text-sm">{money(daily)}</strong></div><div className="rounded-2xl bg-blue-50 p-3 text-blue-800">مأموریت<strong className="mt-1 block text-sm">{money(mission)}</strong></div><div className="rounded-2xl bg-amber-50 p-3 text-amber-900">سنوات<strong className="mt-1 block text-sm">{money(seniorityAmount)}</strong></div><div className="rounded-2xl bg-emerald-50 p-3 text-emerald-800">خالص تقریبی<strong className="mt-1 block text-sm">{money(estimatedNet)}</strong></div></div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between"><div><h2 className="text-sm font-black">👥 کارکنان شرکت</h2><p className="mt-1 text-[11px] text-slate-500">فقط کارکنان شرکت فعال نمایش داده می‌شوند.</p></div><button onClick={selectAll} className="rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white">{selected.length === employees.length && employees.length ? "لغو انتخاب همه" : "انتخاب همه"}</button></div>
          <div className="divide-y divide-slate-100">
            {employees.map((employee) => { const checked = selected.includes(Number(employee.id)); return <label key={employee.id} className={`flex cursor-pointer items-center gap-3 p-4 transition ${checked ? "bg-blue-50" : "bg-white hover:bg-slate-50"}`}><input type="checkbox" checked={checked} onChange={() => toggle(Number(employee.id))} className="h-5 w-5 shrink-0"/><div className="min-w-0 flex-1"><div className="truncate text-sm font-black text-slate-900">{employee.full_name}</div><div className="mt-1 text-[10px] font-bold text-slate-500">پرسنلی: {employee.personnel_code || "—"} · {employee.job_title || "بدون عنوان شغلی"}</div></div><div className="hidden text-left text-xs font-black text-slate-600 sm:block">{employee.department || "—"}</div></label>; })}
            {!employees.length && <div className="p-10 text-center text-sm font-bold text-slate-500">برای این شرکت کارمندی ثبت نشده است.</div>}
          </div>
        </section>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black text-red-700">🔴 {error}</div>}
        {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700">🟢 {message}</div>}
        {result && <div className="grid grid-cols-3 gap-2"><div className="rounded-2xl bg-slate-900 p-4 text-center text-white"><div className="text-[10px]">کل</div><strong className="mt-1 block text-xl">{result.total}</strong></div><div className="rounded-2xl bg-emerald-600 p-4 text-center text-white"><div className="text-[10px]">صادر شد</div><strong className="mt-1 block text-xl">{result.created}</strong></div><div className="rounded-2xl bg-amber-500 p-4 text-center text-white"><div className="text-[10px]">تکراری</div><strong className="mt-1 block text-xl">{result.skipped}</strong></div></div>}

        <button disabled={saving || !selected.length} onClick={submit} className="w-full rounded-3xl bg-gradient-to-l from-blue-700 to-blue-900 px-5 py-4 text-sm font-black text-white shadow-xl transition hover:from-blue-800 hover:to-slate-950 disabled:cursor-not-allowed disabled:opacity-40">{saving ? "در حال صدور گروهی و محاسبه فیش‌ها..." : `صدور ${selected.length.toLocaleString("fa-IR")} فیش حقوقی`}</button>
        <p className="pb-5 text-center text-[10px] font-bold leading-6 text-slate-500">صدور گروهی داخل تراکنش انجام می‌شود؛ اگر خطای جدی رخ دهد، هیچ فیش ناقصی ثبت نخواهد شد.</p>
      </div>
    </main>
  );
}
