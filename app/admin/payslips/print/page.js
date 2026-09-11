"use client";

import { useEffect, useMemo, useState } from "react";

function n(v) { const x = Number(v); return Number.isFinite(x) ? x : 0; }
function money(v) { return n(v).toLocaleString("fa-IR"); }
function idsFrom(value) { return [...new Set(String(value || "").split(",").map(x => Number(x.trim())).filter(x => Number.isInteger(x) && x > 0))]; }

function PayslipSheet({ p, company }) {
  return <article className="payslip-sheet rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">
    <header className="border-b-2 border-slate-900 pb-4"><div className="flex items-start justify-between gap-4"><div><div className="text-xs font-bold text-slate-500">فیش حقوق و دستمزد</div><h2 className="mt-1 text-xl font-black">{company?.name || p.company_name || "شرکت"}</h2></div><div className="text-left text-xs font-bold text-slate-500">شماره فیش: <strong className="text-slate-900">{p.id}</strong><br/>دوره: <strong className="text-slate-900">{p.month} {p.year}</strong></div></div></header>
    <div className="grid grid-cols-2 gap-3 border-b border-slate-200 py-4 text-xs md:grid-cols-4">{[['نام', p.full_name], ['کد پرسنلی', p.personnel_code], ['کد ملی', p.national_id], ['عنوان شغلی', p.job_title || p.employee_job_title]].map(([a,v]) => <div key={a}><span className="text-slate-500">{a}</span><strong className="mt-1 block">{v || "—"}</strong></div>)}</div>
    <div className="grid grid-cols-2 gap-3 py-5 text-xs md:grid-cols-3">{[['حقوق پایه',p.base_salary],['مأموریت',p.mission_allowance],['پایه سنوات',p.seniority_allowance],['اضافه‌کاری',p.overtime],['پاداش',p.bonus],['سایر مزایا',p.other_benefits]].map(([a,v]) => <div key={a} className="rounded-2xl bg-slate-50 p-3">{a}<strong className="mt-1 block text-sm">{money(v)}</strong></div>)}</div>
    <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-4 text-xs md:grid-cols-5"><div>روز کارکرد<strong className="mt-1 block">{p.work_days || 0}</strong></div><div>روز مأموریت<strong className="mt-1 block">{p.mission_days || 0}</strong></div><div>ساعت مأموریت<strong className="mt-1 block">{p.mission_hours || 0}</strong></div><div>بیمه<strong className="mt-1 block">{money(p.insurance)}</strong></div><div>مالیات<strong className="mt-1 block">{money(p.tax)}</strong></div></div>
    <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-950 p-4 text-white"><span className="text-sm font-bold">خالص پرداختی</span><strong className="text-xl">{money(p.net_salary)}</strong></div>
    <footer className="mt-4 flex justify-between text-[9px] text-slate-400"><span>وضعیت دوره: {p.period_status === "closed" ? "بسته" : "باز"}</span><span>نسخه چاپ رسمی</span></footer>
  </article>;
}

export default function PayslipPrintPage() {
  const [companies,setCompanies]=useState([]),[companyId,setCompanyId]=useState(""),[periods,setPeriods]=useState([]),[periodId,setPeriodId]=useState("");
  const [payslips,setPayslips]=useState([]),[selected,setSelected]=useState([]),[preview,setPreview]=useState([]);
  const [loading,setLoading]=useState(true),[loadingData,setLoadingData]=useState(false),[error,setError]=useState("");
  const company=useMemo(()=>companies.find(x=>String(x.id)===String(companyId)),[companies,companyId]);
  const period=useMemo(()=>periods.find(x=>String(x.id)===String(periodId)),[periods,periodId]);
  const filtered=useMemo(()=>payslips.filter(p=>!periodId||String(p.payroll_period_id)===String(periodId)),[payslips,periodId]);
  const selectedItems=useMemo(()=>filtered.filter(p=>selected.includes(Number(p.id))),[filtered,selected]);

  async function loadCompanies(){setLoading(true);setError("");try{const r=await fetch("/api/companies",{cache:"no-store"}),d=await r.json();if(!r.ok||!d.success)throw Error(d.error||"خطا در شرکت‌ها");setCompanies(Array.isArray(d.data)?d.data:[]);}catch(e){setError(e.message||"خطا در دریافت شرکت‌ها")}finally{setLoading(false)}}
  async function loadCompanyData(id){
    if(!id){setPeriods([]);setPeriodId("");setPayslips([]);setSelected([]);return;}
    setLoadingData(true);setError("");
    try{
      const [pr,ps]=await Promise.all([fetch(`/api/payroll-periods?company_id=${encodeURIComponent(id)}`,{cache:"no-store"}),fetch(`/api/payslips?company_id=${encodeURIComponent(id)}`,{cache:"no-store"})]);
      const pd=await pr.json(),sd=await ps.json();if(!pr.ok||!pd.success)throw Error(pd.error||"خطا در دوره‌ها");if(!ps.ok||!sd.success)throw Error(sd.error||"خطا در فیش‌ها");
      setPeriods(Array.isArray(pd.data)?pd.data:[]);setPayslips(Array.isArray(sd.data)?sd.data:[]);
      const q=new URLSearchParams(window.location.search).get("ids"),requested=idsFrom(q),available=(sd.data||[]).filter(x=>requested.includes(Number(x.id))).map(x=>Number(x.id));
      if(requested.length&&available.length){setSelected(available);setPreview((sd.data||[]).filter(x=>available.includes(Number(x.id))));}else{setSelected([]);setPreview([]);}
    }catch(e){setPeriods([]);setPayslips([]);setSelected([]);setPreview([]);setError(e.message||"خطا در دریافت اطلاعات")}finally{setLoadingData(false)}
  }
  useEffect(()=>{loadCompanies()},[]);useEffect(()=>{loadCompanyData(companyId)},[companyId]);
  function toggle(id){setSelected(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id]);setPreview([])}
  function selectAll(){const ids=filtered.map(x=>Number(x.id));setSelected(selected.length===ids.length&&ids.length?[]:ids);setPreview([])}
  function showPreview(){if(!selected.length)return setError("حداقل یک فیش را انتخاب کنید.");setError("");setPreview(selectedItems)}
  function clearPreview(){setPreview([])}
  if(loading)return <main dir="rtl" className="min-h-screen bg-slate-100 p-4 md:p-8"><div className="mx-auto max-w-6xl rounded-3xl bg-white p-10 text-center shadow-sm"><div className="text-5xl">🖨️</div><h1 className="mt-4 text-xl font-black">در حال آماده‌سازی مرکز چاپ...</h1></div></main>;
  return <main dir="rtl" className="min-h-screen bg-slate-100 p-3 text-slate-900 md:p-8">
    <div className="no-print mx-auto max-w-6xl space-y-4">
      <header className="rounded-3xl bg-gradient-to-l from-slate-950 via-blue-950 to-slate-900 p-5 text-white shadow-xl md:p-7"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><div className="text-xs font-bold text-blue-300">PAYROLL PRO · PRINT CENTER</div><h1 className="mt-1 text-2xl font-black">مرکز حرفه‌ای چاپ فیش حقوقی</h1><p className="mt-2 text-xs leading-6 text-slate-300">شرکت و دوره را انتخاب کن، چند فیش را انتخاب کن و یکجا پیش‌نمایش، چاپ یا PDF بگیر.</p></div><div className="rounded-2xl bg-white/10 px-4 py-3 text-center"><div className="text-[10px] text-blue-200">فیش‌های انتخاب‌شده</div><div className="text-2xl font-black">{selected.length.toLocaleString("fa-IR")}</div></div></div></header>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><label className="mb-2 block text-xs font-black text-slate-600">🏢 شرکت</label><select value={companyId} onChange={e=>setCompanyId(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"><option value="">انتخاب شرکت...</option>{companies.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><label className="mb-2 block text-xs font-black text-slate-600">📅 دوره حقوق</label><select value={periodId} onChange={e=>{setPeriodId(e.target.value);setSelected([]);setPreview([])}} disabled={!companyId||loadingData} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"><option value="">همه دوره‌ها</option>{periods.map(x=><option key={x.id} value={x.id}>{x.month} {x.year} · {x.payslip_count||0} فیش · {x.status==="closed"?"بسته":"باز"}</option>)}</select></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-xs font-black text-slate-600">📊 وضعیت</div><div className="mt-2 text-2xl font-black text-slate-950">{filtered.length.toLocaleString("fa-IR")} فیش</div><div className="mt-1 text-[10px] text-slate-500">{period?`${period.month} ${period.year}`:"تمام دوره‌های شرکت"}</div></div>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between"><div><h2 className="text-sm font-black">🧾 انتخاب فیش‌ها</h2><p className="mt-1 text-[11px] text-slate-500">فقط فیش‌های شرکت انتخاب‌شده نمایش داده می‌شوند.</p></div><button onClick={selectAll} disabled={!filtered.length} className="rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40">{selected.length===filtered.length&&filtered.length?"لغو انتخاب همه":"انتخاب همه"}</button></div>{loadingData?<div className="p-10 text-center text-sm font-bold text-slate-500">در حال دریافت فیش‌ها...</div>:<div className="max-h-[520px] divide-y divide-slate-100 overflow-auto">{filtered.map(p=>{const checked=selected.includes(Number(p.id));return <label key={p.id} className={`flex cursor-pointer items-center gap-3 p-4 transition ${checked?"bg-blue-50":"hover:bg-slate-50"}`}><input type="checkbox" checked={checked} onChange={()=>toggle(Number(p.id))} className="h-5 w-5 shrink-0"/><div className="min-w-0 flex-1"><div className="truncate text-sm font-black">{p.full_name||"—"}</div><div className="mt-1 text-[10px] font-bold text-slate-500">فیش #{p.id} · {p.month} {p.year} · پرسنلی {p.personnel_code||"—"}</div></div><div className="text-left text-xs font-black text-slate-700">{money(p.net_salary)}</div></label>})}{!filtered.length&&<div className="p-12 text-center text-sm font-bold text-slate-500">برای این انتخاب فیشی پیدا نشد.</div>}</div>}</section>
      {error&&<div className="no-print rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black text-red-700">🔴 {error}</div>}
      <div className="sticky bottom-3 z-10 flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur md:flex-row md:items-center md:justify-between"><div className="text-xs font-black text-slate-700">{selected.length.toLocaleString("fa-IR")} فیش آماده چاپ</div><div className="flex flex-wrap gap-2"><button onClick={showPreview} disabled={!selected.length} className="rounded-2xl bg-blue-600 px-5 py-3 text-xs font-black text-white disabled:opacity-40">👁️ پیش‌نمایش</button><button onClick={()=>window.print()} disabled={!preview.length} className="rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-black text-white disabled:opacity-40">🖨️ چاپ / PDF</button><button onClick={clearPreview} disabled={!preview.length} className="rounded-2xl bg-slate-100 px-5 py-3 text-xs font-black text-slate-700 disabled:opacity-40">پاک کردن پیش‌نمایش</button></div></div>
    </div>
    {preview.length>0&&<section className="mx-auto mt-6 max-w-5xl space-y-5">{preview.map(p=><PayslipSheet key={p.id} p={p} company={company}/>)}</section>}
    <style jsx global>{`@media print{@page{size:A4;margin:10mm}body{background:#fff!important}.no-print{display:none!important}.payslip-sheet{box-shadow:none!important;border:1px solid #d1d5db!important;border-radius:0!important;break-after:page;page-break-after:always}.payslip-sheet:last-child{break-after:auto;page-break-after:auto}}`}</style>
  </main>;
}
