"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { PAYSLIP_IMPORT_TEMPLATE_COLUMNS, normalizePayslipImportRows } from "../../../lib/payslip-import";

const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const money = (value) => Number(value || 0).toLocaleString("fa-IR");

export default function PayslipExcelPage() {
  const inputRef = useRef(null);
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [employees, setEmployees] = useState([]);
  const [existingPayslips, setExistingPayslips] = useState([]);
  const [rows, setRows] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const employeeMap = useMemo(() => new Map(employees.map((employee) => [String(employee.personnel_code || "").trim(), employee])), [employees]);
  const preparedRows = useMemo(() => rows.map((row) => {
    const employee = employeeMap.get(String(row.personnel_code).trim());
    const duplicate = employee && existingPayslips.some((pay) => Number(pay.personnel_id) === Number(employee.id) && String(pay.year) === String(row.year) && String(pay.month) === String(row.month));
    return { ...row, employee, duplicate };
  }), [rows, employeeMap, existingPayslips]);

  async function loadCompanyData(id) {
    if (!id) { setEmployees([]); setExistingPayslips([]); return; }
    try {
      const employeeResponse = await fetch(`/api/personnel?company_id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const employeeData = await employeeResponse.json();
      if (!employeeResponse.ok || !employeeData.success) throw new Error(employeeData.error || "خطا در دریافت کارکنان");

      const allPayslips = [];
      let page = 1;
      let totalPages = 1;
      do {
        const payslipResponse = await fetch(`/api/payslips?company_id=${encodeURIComponent(id)}&page=${page}&page_size=50`, { cache: "no-store" });
        const payslipData = await payslipResponse.json();
        if (!payslipResponse.ok || !payslipData.success) throw new Error(payslipData.error || "خطا در دریافت فیش‌ها");
        allPayslips.push(...(Array.isArray(payslipData.data) ? payslipData.data : []));
        totalPages = Math.max(1, Number(payslipData.meta?.total_pages || 1));
        page += 1;
      } while (page <= totalPages);

      setEmployees(Array.isArray(employeeData.data) ? employeeData.data : []);
      setExistingPayslips(allPayslips);
    } catch (err) { setError(err.message || "خطا در دریافت اطلاعات شرکت"); }
  }

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/companies", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "خطا در دریافت شرکت‌ها");
        const list = Array.isArray(data.data) ? data.data : [];
        setCompanies(list);
        if (list[0]) setCompanyId(String(list[0].id));
      } catch (err) { setError(err.message || "خطا در دریافت شرکت‌ها"); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => { loadCompanyData(companyId); }, [companyId]);

  function downloadTemplate() {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([PAYSLIP_IMPORT_TEMPLATE_COLUMNS, ["13813", "1405", "شهریور", 31, 0, 0, 0, 0, 30000000, 22000000, 0, 0, 0, 0]]);
    XLSX.utils.book_append_sheet(workbook, worksheet, "فیش حقوقی");
    XLSX.writeFile(workbook, "قالب-ورود-گروهی-فیش-1405.xlsx");
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(""); setMessage(""); setResults([]); setRows([]);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
      if (!rawRows.length) throw new Error("فایل Excel خالی است.");
      setRows(normalizePayslipImportRows(rawRows));
    } catch (err) { setError(err.message || "فایل Excel قابل خواندن نیست."); }
  }

  async function submit() {
    setError(""); setMessage(""); setResults([]);
    if (!companyId) return setError("ابتدا شرکت را انتخاب کنید.");
    if (!preparedRows.length) return setError("ابتدا فایل Excel را انتخاب کنید.");
    const invalid = preparedRows.find((row) => !row.employee);
    if (invalid) return setError(`کد پرسنلی ${invalid.personnel_code} در شرکت انتخاب‌شده پیدا نشد.`);
    const duplicate = preparedRows.find((row) => row.duplicate);
    if (duplicate) return setError(`برای ${duplicate.employee.full_name} در ${duplicate.month} ${duplicate.year} فیش قبلاً ثبت شده است.`);
    setProcessing(true);
    const operationResults = [];
    try {
      for (const row of preparedRows) {
        const employee = row.employee;
        const payload = {
          personnel_id: Number(employee.id), year: row.year, month: row.month,
          work_days: row.work_days, mission_days: row.mission_days, mission_hours: row.mission_hours,
          seniority_eligible: false, overtime: row.overtime, bonus: row.bonus,
          housing_allowance: row.housing_allowance, food_allowance: row.food_allowance,
          marriage_allowance: row.marriage_allowance, child_allowance: row.child_allowance,
          other_benefits: row.other_benefits, other_deductions: row.other_deductions,
        };
        const response = await fetch("/api/payslips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const data = await response.json();
        operationResults.push({ employee: employee.full_name, personnel_code: employee.personnel_code, success: response.ok && data.success, message: response.ok && data.success ? "ثبت شد" : (data.error || "ثبت ناموفق") });
        if (!response.ok || !data.success) throw new Error(`ثبت فیش ${employee.full_name} ناموفق بود: ${data.error || "خطای نامشخص"}`);
      }
      setResults(operationResults);
      setMessage(`${operationResults.length.toLocaleString("fa-IR")} فیش با موفقیت ثبت شد.`);
      setRows([]);
      await loadCompanyData(companyId);
    } catch (err) {
      setResults(operationResults);
      setError(err.message || "ثبت گروهی کامل نشد.");
    } finally { setProcessing(false); }
  }

  if (loading) return <main dir="rtl" className="min-h-screen bg-slate-100 p-4 md:p-8"><div className="mx-auto max-w-6xl rounded-3xl bg-white p-10 text-center shadow-sm"><div className="text-5xl">📥</div><h1 className="mt-4 text-xl font-black">در حال آماده‌سازی ورود گروهی...</h1></div></main>;

  return <main dir="rtl" className="min-h-screen bg-slate-100 p-3 md:p-8"><div className="mx-auto max-w-6xl space-y-4">
    <header className="rounded-3xl bg-gradient-to-l from-slate-950 via-blue-950 to-slate-900 p-5 text-white shadow-xl md:p-7"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><div className="text-xs font-bold text-blue-200">PAYROLL PRO</div><h1 className="mt-1 text-2xl font-black">ورود گروهی فیش حقوقی</h1><p className="mt-2 text-xs leading-6 text-slate-300">فایل Excel را وارد کنید؛ هر ردیف یک فیش مستقل است و محاسبه نهایی با موتور فعلی حقوق ۱۴۰۵ انجام می‌شود.</p></div><div className="rounded-2xl bg-white/10 px-4 py-3 text-center"><div className="text-[10px] text-blue-200">ردیف‌های آماده</div><div className="text-2xl font-black">{preparedRows.length.toLocaleString("fa-IR")}</div></div></div></header>
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="grid gap-4 md:grid-cols-2"><div><label className="mb-2 block text-xs font-black text-slate-600">🏢 شرکت</label><select value={companyId} onChange={(e) => { setCompanyId(e.target.value); setRows([]); setResults([]); }} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold"><option value="">انتخاب شرکت...</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></div><div className="flex items-end gap-2"><button type="button" onClick={downloadTemplate} className="w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-black text-blue-800">📄 دانلود قالب Excel</button><button type="button" onClick={() => inputRef.current?.click()} disabled={!companyId} className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black text-white disabled:opacity-50">📥 انتخاب فایل Excel</button><input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} /></div></div><div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs leading-6 font-bold text-slate-600">ستون‌های اصلی: کد پرسنلی، سال، ماه، روز کارکرد، روز/ساعت مأموریت، اضافه‌کاری، پاداش، حق مسکن، بن، حق تأهل، حق اولاد، سایر مزایا و سایر کسورات.</div></section>
    {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black text-red-700">🔴 {error}</div>}
    {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700">🟢 {message}</div>}
    {!!preparedRows.length && <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between"><div><h2 className="text-sm font-black">👁️ پیش‌نمایش قبل از ثبت</h2><p className="mt-1 text-[11px] text-slate-500">هیچ فیشی تا زدن دکمه تأیید ثبت نمی‌شود.</p></div><button onClick={submit} disabled={processing} className="rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-black text-white disabled:opacity-50">{processing ? "در حال ثبت..." : "✅ تأیید و صدور فیش‌ها"}</button></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-right text-xs"><thead className="bg-slate-50 text-slate-600"><tr><th className="p-3">پرسنل</th><th className="p-3">سال/ماه</th><th className="p-3">کارکرد</th><th className="p-3">مأموریت</th><th className="p-3">اضافه‌کاری</th><th className="p-3">پاداش</th><th className="p-3">مسکن</th><th className="p-3">بن</th><th className="p-3">وضعیت</th></tr></thead><tbody className="divide-y divide-slate-100">{preparedRows.map((row, index) => <tr key={`${row.personnel_code}-${index}`}><td className="p-3 font-black">{row.employee?.full_name || "❌ پیدا نشد"}<div className="text-[10px] text-slate-500">{row.personnel_code}</div></td><td className="p-3">{row.year} / {row.month}</td><td className="p-3 font-black">{money(row.work_days)} روز</td><td className="p-3">{money(row.mission_days)} روز / {money(row.mission_hours)} ساعت</td><td className="p-3">{money(row.overtime)}</td><td className="p-3">{money(row.bonus)}</td><td className="p-3">{money(row.housing_allowance)}</td><td className="p-3">{money(row.food_allowance)}</td><td className={`p-3 font-black ${!row.employee || row.duplicate ? "text-red-600" : "text-emerald-600"}`}>{!row.employee ? "پرسنل پیدا نشد" : row.duplicate ? "فیش تکراری" : "آماده ثبت"}</td></tr>)}</tbody></table></div></section>}
    {!!results.length && <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-black">📋 نتیجه ثبت</h2><div className="mt-3 space-y-2">{results.map((item, index) => <div key={`${item.personnel_code}-${index}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-xs"><span className="font-black">{item.employee} · {item.personnel_code}</span><span className={item.success ? "font-black text-emerald-600" : "font-black text-red-600"}>{item.success ? "✓ ثبت شد" : item.message}</span></div>)}</div></section>}
  </div></main>;
}
