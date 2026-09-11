"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

const emptyForm = {
  name: "",
  nationalId: "",
  personnelCode: "",
  bankAccount: "",
  department: "",
  jobGroup: "",
  role: "",
  companyId: "",
};

function textValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function getExcelValue(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
      return textValue(row[key]);
    }
  }
  return "";
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [activeCompanyId, setActiveCompanyId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [passwordEmployee, setPasswordEmployee] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleteEmployee, setDeleteEmployee] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);

  const activeCompany = useMemo(
    () => companies.find((company) => String(company.id) === String(activeCompanyId)),
    [companies, activeCompanyId]
  );

  async function loadEmployees(companyId = activeCompanyId) {
    if (!companyId) {
      setEmployees([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`/api/personnel?company_id=${encodeURIComponent(companyId)}`, { cache: "no-store" });
      const result = await response.json();
      if (result.success) setEmployees(Array.isArray(result.data) ? result.data : []);
      else alert(result.error || "خطا در دریافت کارکنان");
    } catch (error) {
      console.error("Load employees error:", error);
      alert("خطا در اتصال به سرور");
    } finally {
      setLoading(false);
    }
  }

  async function loadCompanies() {
    try {
      setLoadingCompanies(true);
      const response = await fetch("/api/companies", { cache: "no-store" });
      const result = await response.json();
      if (result.success) {
        const list = Array.isArray(result.data) ? result.data : [];
        setCompanies(list);
        setActiveCompanyId((current) => current || (list[0] ? String(list[0].id) : ""));
      } else alert(result.error || "خطا در دریافت شرکت‌ها");
    } catch (error) {
      console.error("Load companies error:", error);
      alert("خطا در دریافت فهرست شرکت‌ها");
    } finally {
      setLoadingCompanies(false);
    }
  }

  useEffect(() => { loadCompanies(); }, []);

  useEffect(() => {
    if (!activeCompanyId) return;
    setForm((current) => editingId ? current : { ...current, companyId: String(activeCompanyId) });
    loadEmployees(activeCompanyId);
    setSearch("");
  }, [activeCompanyId]);

  function updateForm(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function resetForm() {
    setForm({ ...emptyForm, companyId: activeCompanyId });
    setEditingId(null);
  }

  function handleEdit(employee) {
    setForm({
      name: textValue(employee.full_name),
      nationalId: textValue(employee.national_id),
      personnelCode: textValue(employee.personnel_code),
      bankAccount: textValue(employee.bank_account),
      department: textValue(employee.department),
      jobGroup: textValue(employee.job_group),
      role: textValue(employee.job_title),
      companyId: String(employee.company_id || activeCompanyId),
    });
    setEditingId(employee.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!activeCompanyId) return alert("ابتدا یک شرکت را انتخاب کنید.");
    if (!form.name.trim() || !form.nationalId.trim() || !form.personnelCode.trim()) {
      return alert("نام، کد ملی و کد پرسنلی الزامی هستند.");
    }
    if (String(form.companyId) !== String(activeCompanyId)) {
      return alert("شرکت کارمند باید با شرکت فعال یکسان باشد.");
    }
    try {
      setSaving(true);
      const isEditing = editingId !== null;
      const response = await fetch("/api/personnel", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          company_id: Number(activeCompanyId),
          full_name: form.name.trim(),
          national_id: form.nationalId.trim(),
          personnel_code: form.personnelCode.trim(),
          bank_account: form.bankAccount.trim(),
          department: form.department.trim(),
          job_group: form.jobGroup.trim(),
          job_title: form.role.trim(),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) return alert(result.error || "عملیات انجام نشد.");
      resetForm();
      await loadEmployees(activeCompanyId);
    } catch (error) {
      console.error("Save employee error:", error);
      alert("خطا در اتصال به سرور.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetPassword() {
    if (!passwordEmployee) return;
    const password = newPassword.trim();
    if (password.length < 4) return alert("رمز عبور باید حداقل ۴ کاراکتر باشد.");
    try {
      setSavingPassword(true);
      const response = await fetch("/api/personnel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: passwordEmployee.id,
          company_id: Number(activeCompanyId),
          full_name: textValue(passwordEmployee.full_name),
          national_id: textValue(passwordEmployee.national_id),
          personnel_code: textValue(passwordEmployee.personnel_code),
          department: textValue(passwordEmployee.department),
          job_title: textValue(passwordEmployee.job_title),
          bank_account: textValue(passwordEmployee.bank_account),
          job_group: textValue(passwordEmployee.job_group),
          payslip_password: password,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) return alert(result.error || "تعیین رمز انجام نشد.");
      setPasswordEmployee(null);
      setNewPassword("");
      await loadEmployees(activeCompanyId);
    } catch (error) {
      console.error("Set password error:", error);
      alert("خطا در اتصال به سرور.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function confirmDelete() {
    if (!deleteEmployee) return;
    try {
      setDeleting(true);
      const response = await fetch("/api/personnel", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteEmployee.id, company_id: Number(activeCompanyId) }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) return alert(result.error || "حذف انجام نشد.");
      if (editingId === deleteEmployee.id) resetForm();
      setDeleteEmployee(null);
      await loadEmployees(activeCompanyId);
    } catch (error) {
      console.error("Delete employee error:", error);
      alert("خطا در حذف کارمند.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleExcelImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!activeCompanyId) {
      event.target.value = "";
      return alert("ابتدا شرکت فعال را انتخاب کنید.");
    }
    try {
      setImporting(true);
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) return alert("فایل Excel فاقد Sheet است.");
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
      const imported = rows.map((row) => ({
        full_name: getExcelValue(row, ["نام و نام خانوادگی", "نام", "full_name", "FullName"]),
        national_id: getExcelValue(row, ["کد ملی", "کدملی", "national_id", "NationalID"]),
        personnel_code: getExcelValue(row, ["کد پرسنلی", "کدپرسنلی", "personnel_code", "PersonnelCode"]),
        bank_account: getExcelValue(row, ["شماره حساب", "حساب بانکی", "bank_account", "BankAccount"]),
        department: getExcelValue(row, ["واحد", "واحد سازمانی", "department", "Department"]),
        job_group: getExcelValue(row, ["گروه شغلی", "گروه", "job_group", "JobGroup"]),
        job_title: getExcelValue(row, ["عنوان شغلی", "سمت", "job_title", "JobTitle"]),
      })).filter((item) => item.full_name && item.national_id && item.personnel_code);
      if (!imported.length) return alert("هیچ ردیف معتبری پیدا نشد.");
      const confirmed = window.confirm(`${imported.length.toLocaleString("fa-IR")} پرسنل برای «${activeCompany?.name || "شرکت فعال"}» آماده ثبت است.\n\nآیا ادامه می‌دهید؟`);
      if (!confirmed) return;
      let successCount = 0;
      let errorCount = 0;
      for (const employee of imported) {
        try {
          const response = await fetch("/api/personnel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...employee, company_id: Number(activeCompanyId) }),
          });
          const result = await response.json();
          if (response.ok && result.success) successCount++; else errorCount++;
        } catch { errorCount++; }
      }
      await loadEmployees(activeCompanyId);
      alert(`ورود Excel تمام شد.\n\nثبت موفق: ${successCount.toLocaleString("fa-IR")}\nثبت ناموفق: ${errorCount.toLocaleString("fa-IR")}`);
    } catch (error) {
      console.error("Excel import error:", error);
      alert("خطا در خواندن فایل Excel.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function downloadExcelTemplate() {
    const data = [{
      "نام و نام خانوادگی": "علی رضایی",
      "کد ملی": "0012345678",
      "کد پرسنلی": "1001",
      "شماره حساب": "6037991234567890",
      "واحد": "مالی",
      "گروه شغلی": "کارشناس",
      "عنوان شغلی": "کارشناس مالی",
    }];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "کارکنان");
    XLSX.writeFile(workbook, "template-employees.xlsx");
  }

  const filteredEmployees = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return employees;
    return employees.filter((employee) => [
      employee.full_name, employee.national_id, employee.personnel_code,
      employee.department, employee.job_group, employee.job_title, employee.bank_account,
    ].map((item) => textValue(item).toLowerCase()).some((item) => item.includes(value)));
  }, [employees, search]);

  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100";

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 px-3 py-4 text-slate-800 sm:px-5 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <section className="mb-4 overflow-hidden rounded-2xl bg-gradient-to-l from-indigo-700 via-indigo-600 to-violet-600 p-4 text-white shadow-xl sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-1 text-xs font-medium text-indigo-100">سیستم حقوق و دستمزد</div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">مدیریت کارکنان</h1>
              <p className="mt-1 text-xs leading-6 text-indigo-100 sm:text-sm">کارکنان هر شرکت کاملاً جدا و کنترل‌شده مدیریت می‌شوند.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-center backdrop-blur">
                <div className="text-[11px] text-indigo-100">شرکت فعال</div>
                <div className="mt-0.5 max-w-[170px] truncate text-sm font-black">{activeCompany?.name || "انتخاب نشده"}</div>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-center backdrop-blur">
                <div className="text-[11px] text-indigo-100">کارکنان</div>
                <div className="mt-0.5 text-xl font-black">{employees.length.toLocaleString("fa-IR")}</div>
              </div>
              <button type="button" onClick={() => { loadCompanies(); loadEmployees(); }} className="col-span-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-indigo-700 shadow-lg hover:bg-indigo-50 sm:col-span-1">↻ بروزرسانی</button>
            </div>
          </div>
        </section>

        <section className="mb-4 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-black text-slate-600">🏢 شرکت فعال</label>
              <select className={inputClass} value={activeCompanyId} disabled={loadingCompanies} onChange={(event) => { setActiveCompanyId(event.target.value); setEditingId(null); setForm({ ...emptyForm, companyId: event.target.value }); }}>
                <option value="">{loadingCompanies ? "در حال دریافت شرکت‌ها..." : "انتخاب شرکت"}</option>
                {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
              </select>
            </div>
            <div className="rounded-xl bg-indigo-50 px-4 py-3 text-xs font-bold leading-6 text-indigo-700 md:max-w-md">تمام عملیات این صفحه روی شرکت فعال انجام می‌شود؛ از جمله ثبت، ویرایش، جستجو، حذف و ورود Excel.</div>
          </div>
          {!loadingCompanies && companies.length === 0 && <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-700">برای شروع ابتدا یک شرکت از بخش «شرکت‌ها» ثبت کنید.</div>}
        </section>

        {activeCompanyId && (
          <section className="mb-4 grid gap-4 xl:grid-cols-[1fr_320px]">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
                <div><h2 className="text-lg font-black">{editingId !== null ? "ویرایش کارمند" : "ثبت کارمند جدید"}</h2><p className="mt-1 text-[11px] text-slate-400">شرکت: {activeCompany?.name || "-"}</p></div>
                {editingId !== null && <button type="button" onClick={resetForm} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">انصراف</button>}
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[ ["name","نام و نام خانوادگی *","مثلاً علی رضایی"], ["nationalId","کد ملی *","۱۰ رقمی"], ["personnelCode","کد پرسنلی *","مثلاً 1001"], ["bankAccount","شماره حساب","شماره حساب"], ["department","واحد سازمانی","مثلاً مالی"], ["jobGroup","گروه شغلی","مثلاً کارشناس"], ["role","عنوان شغلی","مثلاً کارشناس منابع انسانی"] ].map(([field,label,placeholder]) => (
                    <div key={field} className={field === "role" ? "sm:col-span-2" : ""}>
                      <label className="mb-1.5 block text-xs font-black text-slate-600">{label}</label>
                      <input className={inputClass} value={form[field]} onChange={(event) => updateForm(field, event.target.value)} placeholder={placeholder} inputMode={field === "nationalId" ? "numeric" : "text"} />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-md hover:bg-indigo-700 disabled:opacity-60">{saving ? "در حال ذخیره..." : editingId !== null ? "ذخیره تغییرات" : "＋ ثبت کارمند"}</button>
                  <button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 hover:bg-slate-50">پاک کردن فرم</button>
                </div>
              </form>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-xs font-black text-white">XLS</div><div><h2 className="font-black">ورود گروهی</h2><p className="text-[11px] text-slate-500">فقط برای شرکت فعال</p></div></div>
              <div className="rounded-xl border border-dashed border-emerald-300 bg-white p-4 text-center">
                <p className="text-xs leading-6 text-slate-500">Excel بدون نیاز به ستون شرکت؛ همه ردیف‌ها در شرکت فعال ثبت می‌شوند.</p>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleExcelImport} className="hidden" />
                <button type="button" disabled={importing} onClick={() => fileInputRef.current?.click()} className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60">{importing ? "در حال ورود..." : "انتخاب فایل Excel"}</button>
                <button type="button" onClick={downloadExcelTemplate} className="mt-2 w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-black text-emerald-700">↓ دانلود نمونه Excel</button>
              </div>
            </div>
          </section>
        )}

        {activeCompanyId && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4 sm:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div><h2 className="text-lg font-black">فهرست کارکنان</h2><p className="mt-1 text-[11px] text-slate-400">{activeCompany?.name || "شرکت فعال"} · {filteredEmployees.length.toLocaleString("fa-IR")} نفر نمایش داده می‌شود</p></div>
                <div className="relative w-full md:w-80"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جستجو نام، کد ملی یا کد پرسنلی..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-10 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" /><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span></div>
              </div>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1050px] border-collapse text-right text-[12px]">
                <thead><tr className="bg-slate-800 text-white"><th className="px-3 py-3 text-center">ردیف</th><th className="px-3 py-3">نام و نام خانوادگی</th><th className="px-3 py-3">کد ملی</th><th className="px-3 py-3">کد پرسنلی</th><th className="px-3 py-3">واحد</th><th className="px-3 py-3">عنوان شغلی</th><th className="px-3 py-3 text-center">عملیات</th></tr></thead>
                <tbody>{loading ? <tr><td colSpan="7" className="py-12 text-center text-slate-400">در حال دریافت...</td></tr> : filteredEmployees.length === 0 ? <tr><td colSpan="7" className="py-12 text-center text-slate-400">👤 کارمندی پیدا نشد</td></tr> : filteredEmployees.map((employee,index) => <tr key={employee.id} className="border-b border-slate-100 hover:bg-indigo-50/50"><td className="px-3 py-3 text-center font-bold text-slate-400">{(index+1).toLocaleString("fa-IR")}</td><td className="px-3 py-3 font-black">{textValue(employee.full_name) || "-"}</td><td className="px-3 py-3 font-mono">{textValue(employee.national_id) || "-"}</td><td className="px-3 py-3"><span className="rounded-lg bg-indigo-50 px-2.5 py-1 font-bold text-indigo-700">{textValue(employee.personnel_code) || "-"}</span></td><td className="px-3 py-3">{textValue(employee.department) || "-"}</td><td className="px-3 py-3">{textValue(employee.job_title) || "-"}</td><td className="px-3 py-3"><div className="flex justify-center gap-1.5"><button type="button" onClick={() => handleEdit(employee)} className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700">ویرایش</button><button type="button" onClick={() => { setPasswordEmployee(employee); setNewPassword(""); }} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-black text-indigo-700">🔑 رمز</button><button type="button" onClick={() => setDeleteEmployee(employee)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-black text-red-600">حذف</button></div></td></tr>)}</tbody>
              </table>
            </div>

            <div className="space-y-3 p-3 md:hidden">
              {loading ? <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-400">در حال دریافت کارکنان...</div> : filteredEmployees.length === 0 ? <div className="rounded-xl bg-slate-50 p-8 text-center"><div className="text-3xl">👤</div><div className="mt-2 text-sm font-black text-slate-500">کارمندی پیدا نشد</div></div> : filteredEmployees.map((employee,index) => (
                <article key={employee.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">#{(index+1).toLocaleString("fa-IR")}</span><h3 className="truncate text-base font-black text-slate-800">{textValue(employee.full_name) || "-"}</h3></div><p className="mt-2 text-xs text-slate-500">کد پرسنلی: <strong className="text-indigo-700">{textValue(employee.personnel_code) || "-"}</strong></p></div><span className="shrink-0 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">{activeCompany?.name || "شرکت"}</span></div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]"><div className="rounded-xl bg-slate-50 p-2.5"><span className="text-slate-400">کد ملی</span><div className="mt-1 font-mono font-bold">{textValue(employee.national_id) || "-"}</div></div><div className="rounded-xl bg-slate-50 p-2.5"><span className="text-slate-400">واحد</span><div className="mt-1 font-bold">{textValue(employee.department) || "-"}</div></div><div className="col-span-2 rounded-xl bg-slate-50 p-2.5"><span className="text-slate-400">عنوان شغلی</span><div className="mt-1 font-bold">{textValue(employee.job_title) || "-"}</div></div></div>
                  <div className="mt-3 grid grid-cols-3 gap-2"><button type="button" onClick={() => handleEdit(employee)} className="rounded-xl bg-amber-50 py-2.5 text-xs font-black text-amber-700">ویرایش</button><button type="button" onClick={() => { setPasswordEmployee(employee); setNewPassword(""); }} className="rounded-xl bg-indigo-50 py-2.5 text-xs font-black text-indigo-700">🔑 رمز</button><button type="button" onClick={() => setDeleteEmployee(employee)} className="rounded-xl bg-red-50 py-2.5 text-xs font-black text-red-600">حذف</button></div>
                </article>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3 text-[11px] text-slate-500"><span>کل شرکت: <strong className="text-slate-700">{employees.length.toLocaleString("fa-IR")}</strong> نفر</span><span>نتیجه: <strong className="text-indigo-600">{filteredEmployees.length.toLocaleString("fa-IR")}</strong></span></div>
          </section>
        )}

        {passwordEmployee && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-3 sm:items-center sm:p-5"><div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-6"><div className="flex items-center justify-between"><div><h3 className="text-lg font-black">🔑 تعیین رمز ورود</h3><p className="mt-1 text-xs text-slate-500">{textValue(passwordEmployee.full_name)} · {activeCompany?.name}</p></div><button type="button" onClick={() => { setPasswordEmployee(null); setNewPassword(""); }} className="rounded-xl bg-slate-100 px-3 py-2">✕</button></div><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="رمز حداقل ۴ کاراکتر" className={`${inputClass} mt-5`} autoFocus /><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={handleSetPassword} disabled={savingPassword} className="rounded-xl bg-indigo-600 py-3 text-sm font-black text-white disabled:opacity-60">{savingPassword ? "در حال ذخیره..." : "✓ ذخیره رمز"}</button><button type="button" onClick={() => { setPasswordEmployee(null); setNewPassword(""); }} className="rounded-xl bg-slate-100 py-3 text-sm font-black text-slate-600">انصراف</button></div></div></div>}

        {deleteEmployee && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-3 sm:items-center sm:p-5"><div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-6"><div className="text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">⚠️</div><h3 className="mt-4 text-lg font-black">حذف دائمی کارمند</h3><p className="mt-2 text-sm leading-7 text-slate-500">کارمند <strong className="text-slate-800">{textValue(deleteEmployee.full_name)}</strong> از شرکت <strong className="text-slate-800">{activeCompany?.name}</strong> حذف می‌شود. در صورت وجود فیش، سوابق وابسته نیز طبق منطق سامانه حذف خواهند شد.</p></div><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={confirmDelete} disabled={deleting} className="rounded-xl bg-red-600 py-3 text-sm font-black text-white disabled:opacity-60">{deleting ? "در حال حذف..." : "حذف دائمی"}</button><button type="button" onClick={() => setDeleteEmployee(null)} className="rounded-xl bg-slate-100 py-3 text-sm font-black text-slate-600">انصراف</button></div></div></div>}
      </div>
    </main>
  );
}
