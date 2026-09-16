"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function OrderDocumentAdminPage() {
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [search, setSearch] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/companies", { cache: "no-store" });
      const x = await r.json();
      if (x.success) setCompanies(x.data || []);
    })();
  }, []);

  useEffect(() => {
    if (!companyId) { setEmployees([]); return; }
    (async () => {
      const r = await fetch(`/api/personnel?company_id=${encodeURIComponent(companyId)}`, { cache: "no-store" });
      const x = await r.json();
      setEmployees(x.success ? x.data || [] : []);
    })();
  }, [companyId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => [e.full_name, e.personnel_code, e.national_id].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [employees, search]);

  async function upload() {
    setMessage("");
    if (!employeeId) return setMessage("ابتدا پرسنل را انتخاب کنید.");
    if (!file) return setMessage("فایل حکم را انتخاب کنید.");
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) return setMessage("فقط PDF یا تصویر JPG، PNG و WEBP مجاز است.");
    if (file.size > 8 * 1024 * 1024) return setMessage("حجم فایل بیشتر از ۸ مگابایت است.");
    try {
      setSaving(true);
      const body = new FormData();
      body.append("personnel_id", employeeId);
      body.append("document", file);
      const r = await fetch("/api/personnel/order-document", { method: "POST", body });
      const x = await r.json();
      if (!r.ok || !x.success) throw new Error(x.error || "ذخیره حکم انجام نشد.");
      setMessage("حکم کارگزینی با موفقیت ثبت شد و برای همان پرسنل قابل مشاهده است.");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      setMessage(e.message || "خطا در ذخیره حکم.");
    } finally { setSaving(false); }
  }

  return <main dir="rtl" className="min-h-screen bg-slate-100 p-4 text-slate-900 sm:p-7">
    <div className="mx-auto max-w-4xl">
      <header className="overflow-hidden rounded-[30px] bg-gradient-to-l from-slate-950 via-blue-950 to-blue-700 p-6 text-white shadow-xl">
        <div className="text-xs font-bold text-blue-200">مدیریت کارکنان</div>
        <h1 className="mt-2 text-2xl font-black">📋 حکم کارگزینی پرسنل</h1>
        <p className="mt-2 text-xs leading-6 text-slate-300">حکم واقعی پرسنل را به‌صورت PDF یا تصویر ثبت کنید تا فقط همان کارمند آن را در پنل خود مشاهده کند.</p>
      </header>

      <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-lg sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <label><span className="mb-2 block text-xs font-black">شرکت</span><select value={companyId} onChange={(e) => { setCompanyId(e.target.value); setEmployeeId(""); }} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold"><option value="">انتخاب شرکت...</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label><span className="mb-2 block text-xs font-black">جستجوی پرسنل</span><input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm" placeholder="نام، کد ملی یا کد پرسنلی" /></label>
        </div>
        <label className="mt-4 block"><span className="mb-2 block text-xs font-black">انتخاب پرسنل</span><select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3.5 text-sm font-black"><option value="">انتخاب پرسنل...</option>{filtered.map((e) => <option key={e.id} value={e.id}>{e.full_name} — {e.personnel_code} — {e.national_id}</option>)}</select></label>

        <div className="mt-5 rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50/60 p-5 text-center">
          <div className="text-4xl">📎</div>
          <div className="mt-2 text-sm font-black">فایل حکم کارگزینی</div>
          <div className="mt-1 text-[11px] font-bold text-slate-500">PDF، JPG، PNG یا WEBP — حداکثر ۸ مگابایت</div>
          <input ref={inputRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-4 block w-full text-xs" />
          {file && <div className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-black text-blue-800">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</div>}
        </div>

        {message && <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-center text-xs font-black text-slate-700">{message}</div>}
        <button type="button" onClick={upload} disabled={saving} className="mt-5 w-full rounded-2xl bg-blue-700 px-4 py-4 text-sm font-black text-white shadow-lg shadow-blue-700/20 disabled:opacity-50">{saving ? "در حال ثبت حکم..." : "ثبت حکم برای پرسنل"}</button>
        <a href="/admin/employees" className="mt-3 block text-center text-xs font-black text-blue-700">← بازگشت به مدیریت کارکنان</a>
      </section>
    </div>
  </main>;
}
