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

const steps = [
  { id: 1, title: "هویتی", fields: ["name", "nationalId", "personnelCode"] },
  { id: 2, title: "شغلی", fields: ["department", "jobGroup", "role"] },
  { id: 3, title: "بانکی", fields: ["bankAccount"] },
  { id: 4, title: "دسترسی", fields: [] },
];

function textValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function getExcelValue(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") return textValue(row[key]);
  }
  return "";
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [activeCompanyId, setActiveCompanyId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [formStep, setFormStep] = useState(1);
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
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);
  const searchRef = useRef(null);

  const activeCompany = useMemo(
    () => companies.find((company) => String(company.id) === String(activeCompanyId)),
    [companies, activeCompanyId]
  );

  const passwordStats = useMemo(() => ({
    withPassword: employees.filter((employee) => Boolean(employee.payslip_password || employee.has_payslip_password)).length,
    withoutPassword: employees.filter((employee) => !employee.payslip_password && !employee.has_payslip_password).length,
  }), [employees]);

  const filteredEmployees = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return employees;
    return employees.filter((employee) => [
      employee.full_name,
      employee.national_id,
      employee.personnel_code,
      employee.department,
      employee.job_group,
      employee.job_title,
      employee.bank_account,
    ].map((item) => textValue(item).toLowerCase()).some((item) => item.includes(value)));
  }, [employees, search]);

  function notify(message, type = "success") {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  }

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
      else notify(result.error || "خطا در دریافت کارکنان", "error");
    } catch (error) {
      console.error(error);
      notify("خطا در اتصال به سرور", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadCompanies() {
    try {
      setLoadingCompanies(true);
      const response = await fetch("/api/companies", { cache: "no-store" });
      const result = await response.json();
      if (!result.success) return notify(result.error || "خطا در دریافت شرکت‌ها", "error");
      const list = Array.isArray(result.data) ? result.data : [];
      setCompanies(list);
      setActiveCompanyId((current) => current && list.some((item) => String(item.id) === String(current)) ? current : (list[0] ? String(list[0].id) : ""));
    } catch (error) {
      console.error(error);
      notify("خطا در دریافت فهرست شرکت‌ها", "error");
    } finally {
      setLoadingCompanies(false);
    }
  }

  useEffect(() => { loadCompanies(); }, []);

  useEffect(() => {
    if (!activeCompanyId) return;
    if (!editingId) setForm((current) => ({ ...current, companyId: String(activeCompanyId) }));
    setSearch("");
    loadEmployees(activeCompanyId);
  }, [activeCompanyId]);

  function updateForm(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function resetForm() {
    setForm({ ...emptyForm, companyId: activeCompanyId });
    setFormStep(1);
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
    setFormStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateStep(step) {
    if (step === 1) {
      if (!form.name.trim() || !form.nationalId.trim() || !form.personnelCode.trim()) {
        notify("نام، کد ملی و کد پرسنلی در بخش هویتی الزامی هستند.", "error");
        return false;
      }
    }
    return true;
  }

  function nextStep() {
    if (!validateStep(formStep)) return;
    setFormStep((step) => Math.min(4, step + 1));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!activeCompanyId) return notify("ابتدا یک شرکت را انتخاب کنید.", "error");
    if (!validateStep(1) || String(form.companyId) !== String(activeCompanyId)) return;
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
      if (!response.ok || !result.success) return notify(result.error || "عملیات انجام نشد.", "error");
      notify(isEditing ? "اطلاعات کارمند با موفقیت ویرایش شد." : "کارمند جدید با موفقیت ثبت شد.");
      resetForm();
      await loadEmployees(activeCompanyId);
    } catch (error) {
      console.error(error);
      notify("خطا در اتصال به سرور.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetPassword() {
    if (!passwordEmployee) return;
    const password = newPassword.trim();
    if (password.length < 4) return notify("رمز عبور باید حداقل ۴ کاراکتر باشد.", "error");
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
      if (!response.ok || !result.success) return notify(result.error || "تعیین رمز انجام نشد.", "error");
      setPasswordEmployee(null);
      setNewPassword("");
      notify("رمز ورود فیش حقوقی ذخیره شد.");
      await loadEmployees(activeCompanyId);
    } catch (error) {
      console.error(error);
      notify("خطا در اتصال به سرور.", "error");
    } finally {
      setSavingPassword(false);
    }
  }

  async function confirmDelete() {
    if (!deleteEmployee || !deleteArmed) return;
    try {
      setDeleting(true);
      const response = await fetch("/api/personnel", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteEmployee.id, company_id: Number(activeCompanyId) }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) return notify(result.error || "حذف انجام نشد.", "error");
      if (editingId === deleteEmployee.id) resetForm();
      setDeleteEmployee(null);
      setDeleteArmed(false);
      notify("کارمند و اطلاعات حقوقی وابسته به او حذف شد.");
      await loadEmployees(activeCompanyId);
    } catch (error) {
      console.error(error);
      notify("خطا در حذف کارمند.", "error");
    } finally {
      setDeleting(false);
    }
  }

  async function handleExcelImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!activeCompanyId) {
      event.target.value = "";
      return notify("ابتدا شرکت فعال را انتخاب کنید.", "error");
    }
    try {
      setImporting(true);
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) return notify("فایل Excel فاقد Sheet است.", "error");
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
      if (!imported.length) return notify("هیچ ردیف معتبری پیدا نشد.", "error");
      const confirmed = window.confirm(`${imported.length.toLocaleString("fa-IR")} ردیف برای «${activeCompany?.name || "شرکت فعال"}» آماده ثبت است.\n\nادامه می‌دهید؟`);
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
          if (response.ok && result.success) successCount += 1;
          else errorCount += 1;
        } catch {
          errorCount += 1;
        }
      }
      await loadEmployees(activeCompanyId);
      notify(`ورود Excel تمام شد؛ ${successCount.toLocaleString("fa-IR")} موفق و ${errorCount.toLocaleString("fa-IR")} ناموفق.`);
    } catch (error) {
      console.error(error);
      notify("خطا در خواندن فایل Excel.", "error");
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

  function renderField(label, field, placeholder, type = "text") {
    return (
      <label className="block">
        <span className="mb-1.5 block text-xs font-bold text-slate-600">{label}</span>
        <input
          type={type}
          value={form[field]}
          onChange={(event) => updateForm(field, event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          placeholder={placeholder}
        />
      </label>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 px-3 py-4 text-slate-800 sm:px-5 lg:px-8">
      {toast && (
        <div className={`fixed inset-x-3 top-3 z-[100] mx-auto max-w-md rounded-2xl px-4 py-3 text-sm font-bold shadow-2xl ${toast.type === "error" ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"}`}>
          {toast.message}
        </div>
      )}

      <div className="mx-auto max-w-[1600px]">
        <section className="mb-4 overflow-hidden rounded-3xl bg-gradient-to-l from-indigo-700 via-indigo-600 to-violet-600 p-4 text-white shadow-xl sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-1 text-xs font-bold text-indigo-100">سیستم حقوق و دستمزد</div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">مدیریت کارکنان</h1>
              <p className="mt-1 text-xs leading-6 text-indigo-100 sm:text-sm">همه عملیات این صفحه فقط روی شرکت فعال انجام می‌شود.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="کل کارکنان" value={employees.length} />
              <Stat label="دارای رمز" value={passwordStats.withPassword} />
              <Stat label="بدون رمز" value={passwordStats.withoutPassword} />
              <Stat label="نتیجه جستجو" value={filteredEmployees.length} />
            </div>
          </div>
        </section>

        <section className="sticky top-2 z-30 mb-4 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(240px,360px)_1fr_auto_auto] lg:items-end">
            <label className="block">
              <span className="mb-1.5 block text-xs font-black text-slate-600">شرکت فعال</span>
              <select
                value={activeCompanyId}
                onChange={(event) => { resetForm(); setActiveCompanyId(event.target.value); }}
                disabled={loadingCompanies}
                className="w-full rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-3 text-sm font-black text-indigo-900 outline-none focus:ring-4 focus:ring-indigo-100"
              >
                <option value="">انتخاب شرکت...</option>
                {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
              </select>
            </label>
            <label className="relative block">
              <span className="mb-1.5 block text-xs font-black text-slate-600">جستجوی سریع</span>
              <input ref={searchRef} value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" placeholder="نام، کد ملی، کد پرسنلی، واحد، سمت..." />
              <span className="absolute right-3 top-[39px] text-slate-400">⌕</span>
            </label>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!activeCompanyId || importing} className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-md hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">{importing ? "در حال ورود..." : "ورود Excel"}</button>
            <button type="button" onClick={downloadExcelTemplate} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">قالب Excel</button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelImport} />
          </div>
          {activeCompany && <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500"><span className="rounded-full bg-indigo-50 px-3 py-1.5 text-indigo-700">شرکت: {activeCompany.name}</span><span>{search ? `${filteredEmployees.length.toLocaleString("fa-IR")} نتیجه از ${employees.length.toLocaleString("fa-IR")}` : "جستجو در محدوده شرکت فعال"}</span></div>}
        </section>

        <div className="grid gap-4 xl:grid-cols-[390px_minmax(0,1fr)]">
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 xl:sticky xl:top-24 xl:self-start">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div><h2 className="text-lg font-black">{editingId ? "ویرایش کارمند" : "افزودن کارمند"}</h2><p className="mt-1 text-xs text-slate-500">فرم مرحله‌ای، سریع و مناسب موبایل</p></div>
              {editingId && <button type="button" onClick={resetForm} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black">انصراف</button>}
            </div>

            <div className="mb-5 grid grid-cols-4 gap-1.5">
              {steps.map((step) => <button key={step.id} type="button" onClick={() => step.id <= formStep || validateStep(formStep) ? setFormStep(step.id) : null} className={`rounded-xl px-2 py-2 text-center text-[11px] font-black transition ${formStep === step.id ? "bg-indigo-600 text-white shadow" : step.id < formStep ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-400"}`}><span className="block text-base">{step.id}</span>{step.title}</button>)}
            </div>

            <form onSubmit={handleSubmit}>
              {formStep === 1 && <div className="space-y-3">{renderField("نام و نام خانوادگی *", "name", "مثلاً علی رضایی")}{renderField("کد ملی *", "nationalId", "۱۰ رقمی")}{renderField("کد پرسنلی *", "personnelCode", "مثلاً 1001")}</div>}
              {formStep === 2 && <div className="space-y-3">{renderField("واحد سازمانی", "department", "مثلاً مالی")}{renderField("گروه شغلی", "jobGroup", "مثلاً کارشناس")}{renderField("عنوان شغلی", "role", "مثلاً کارشناس مالی")}</div>}
              {formStep === 3 && <div className="space-y-3">{renderField("شماره حساب", "bankAccount", "شماره حساب یا شبای ثبت‌شده")}</div>}
              {formStep === 4 && <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600"><div className="mb-2 font-black text-slate-800">دسترسی فیش حقوقی</div><p>رمز ورود را می‌توانید بعد از ثبت کارمند از کارت او تعیین یا تغییر دهید.</p><div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-800">شرکت فعال: <b>{activeCompany?.name || "انتخاب نشده"}</b></div></div>}

              <div className="mt-5 flex gap-2">
                {formStep > 1 && <button type="button" onClick={() => setFormStep((step) => step - 1)} className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-black">قبلی</button>}
                {formStep < 4 ? <button type="button" onClick={nextStep} className="flex-1 rounded-xl bg-indigo-600 px-3 py-3 text-sm font-black text-white shadow-md hover:bg-indigo-700">مرحله بعد</button> : <button type="submit" disabled={saving || !activeCompanyId} className="flex-1 rounded-xl bg-emerald-600 px-3 py-3 text-sm font-black text-white shadow-md hover:bg-emerald-700 disabled:opacity-50">{saving ? "در حال ذخیره..." : editingId ? "ذخیره تغییرات" : "ثبت کارمند"}</button>}
              </div>
            </form>
          </section>

          <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-black">فهرست کارکنان</h2><p className="mt-1 text-xs text-slate-500">{activeCompany?.name || "شرکت انتخاب نشده"}</p></div><div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">{filteredEmployees.length.toLocaleString("fa-IR")} نفر</div></div>

            {loading ? <div className="grid gap-3 sm:grid-cols-2"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div> : !activeCompanyId ? <EmptyState title="شرکت را انتخاب کنید" text="برای مشاهده و مدیریت کارکنان، ابتدا شرکت فعال را انتخاب کنید." /> : filteredEmployees.length === 0 ? <EmptyState title={search ? "نتیجه‌ای پیدا نشد" : "هنوز کارمندی ثبت نشده"} text={search ? "عبارت جستجو را تغییر دهید یا فیلتر را پاک کنید." : "از فرم افزودن کارمند استفاده کنید یا فایل Excel وارد کنید."} /> : <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{filteredEmployees.map((employee) => <EmployeeCard key={employee.id} employee={employee} onEdit={handleEdit} onPassword={(item) => { setPasswordEmployee(item); setNewPassword(""); }} onDelete={(item) => { setDeleteEmployee(item); setDeleteArmed(false); }} />)}</div>}
          </section>
        </div>
      </div>

      {passwordEmployee && <Modal title="رمز فیش حقوقی" onClose={() => { setPasswordEmployee(null); setNewPassword(""); }}><div className="space-y-4"><div className="rounded-2xl bg-indigo-50 p-4"><div className="font-black text-indigo-900">{passwordEmployee.full_name}</div><div className="mt-1 text-xs text-indigo-700">کد پرسنلی: {passwordEmployee.personnel_code}</div></div><label className="block"><span className="mb-1.5 block text-xs font-black text-slate-600">رمز جدید</span><input autoFocus type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" placeholder="حداقل ۴ کاراکتر" /></label><button type="button" onClick={handleSetPassword} disabled={savingPassword} className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50">{savingPassword ? "در حال ذخیره..." : "ذخیره رمز"}</button></div></Modal>}

      {deleteEmployee && <Modal title="حذف دائمی کارمند" onClose={() => { setDeleteEmployee(null); setDeleteArmed(false); }}><div className="space-y-4"><div className="rounded-2xl border border-rose-200 bg-rose-50 p-4"><div className="font-black text-rose-800">{deleteEmployee.full_name}</div><div className="mt-1 text-xs text-rose-700">{activeCompany?.name || "شرکت فعال"} · کد {deleteEmployee.personnel_code}</div></div><p className="text-sm leading-7 text-slate-600">این عملیات دائمی است و اطلاعات حقوقی وابسته به این کارمند نیز حذف می‌شود. اگر مطمئن هستید، تأیید دوم را فعال کنید.</p><label className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-700"><input type="checkbox" checked={deleteArmed} onChange={(event) => setDeleteArmed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-rose-600" />متوجه هستم که حذف دائمی است و قابل بازگشت نیست.</label><button type="button" onClick={confirmDelete} disabled={!deleteArmed || deleting} className="w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">{deleting ? "در حال حذف..." : "تأیید نهایی حذف"}</button></div></Modal>}
    </main>
  );
}

function Stat({ label, value }) {
  return <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-center backdrop-blur"><div className="text-[10px] font-bold text-indigo-100">{label}</div><div className="mt-0.5 text-lg font-black">{Number(value || 0).toLocaleString("fa-IR")}</div></div>;
}

function EmployeeCard({ employee, onEdit, onPassword, onDelete }) {
  const hasPassword = Boolean(employee.payslip_password || employee.has_payslip_password);
  return <article className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:shadow-lg">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-base font-black text-slate-900">{employee.full_name || "بدون نام"}</h3><div className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-bold text-slate-500"><span className="rounded-full bg-white px-2 py-1">پرسنلی {employee.personnel_code || "—"}</span><span className="rounded-full bg-white px-2 py-1">ملی {employee.national_id || "—"}</span></div></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${hasPassword ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{hasPassword ? "رمز فعال" : "بدون رمز"}</span></div>
    <div className="mt-4 grid grid-cols-2 gap-2 text-xs"><Info label="واحد" value={employee.department} /><Info label="سمت" value={employee.job_title || employee.job_group} /><Info label="حساب" value={employee.bank_account} /></div>
    <div className="mt-4 grid grid-cols-3 gap-2"><button type="button" onClick={() => onEdit(employee)} className="rounded-xl bg-indigo-50 px-2 py-2.5 text-xs font-black text-indigo-700 hover:bg-indigo-100">ویرایش</button><button type="button" onClick={() => onPassword(employee)} className="rounded-xl bg-slate-900 px-2 py-2.5 text-xs font-black text-white hover:bg-slate-800">{hasPassword ? "تغییر رمز" : "تعیین رمز"}</button><button type="button" onClick={() => onDelete(employee)} className="rounded-xl bg-rose-50 px-2 py-2.5 text-xs font-black text-rose-700 hover:bg-rose-100">حذف</button></div>
  </article>;
}

function Info({ label, value }) {
  return <div className="min-w-0 rounded-xl bg-white p-2.5"><div className="text-[10px] font-bold text-slate-400">{label}</div><div className="mt-1 truncate text-xs font-black text-slate-700">{value || "—"}</div></div>;
}

function Skeleton() { return <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />; }

function EmptyState({ title, text }) { return <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><div><div className="text-base font-black text-slate-700">{title}</div><p className="mt-2 max-w-md text-xs leading-6 text-slate-500">{text}</p></div></div>; }

function Modal({ title, children, onClose }) {
  return <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:items-center"><div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-6"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-lg font-black">{title}</h2><button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-600">×</button></div>{children}</div></div>;
}
