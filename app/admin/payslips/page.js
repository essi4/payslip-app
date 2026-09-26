"use client";

import "./payslips.css";
import { useEffect, useMemo, useState } from "react";
import { calculatePayroll1405, daysInPersianMonth } from "../../lib/payroll-1405";

const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const DISPLAY_CURRENCY = "ریال";
const PAGE_SIZE = 20;
const EMPTY_FORM = {
  personnel_id: "", year: "1405", month: "فروردین", bank_account: "", job_group: "", job_title: "",
  work_days: "31", mission_days: "0", mission_hours: "0", seniority_eligible: false,
  overtime: "", bonus: "", housing_allowance: "", food_allowance: "", marriage_allowance: "", child_allowance: "", other_benefits: "",
  other_deductions: "",
};

const number = (value) => { const n = Number(value); return Number.isFinite(n) ? n : 0; };
const fa = (value) => number(value).toLocaleString("fa-IR");

const paymentMonth = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= MONTHS.length ? MONTHS[n - 1] : value || "---";
};
const formatYear = (value) => String(value ?? "")
  .replace(/[0-9]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)])
  .replace(/[٠-٩]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"["٠١٢٣٤٥٦٧٨٩".indexOf(digit)]);

export default function PayslipsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [companies, setCompanies] = useState([]), [companyId, setCompanyId] = useState("");
  const [employees, setEmployees] = useState([]), [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true), [companiesLoading, setCompaniesLoading] = useState(true), [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null), [error, setError] = useState("");
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [payslipMeta, setPayslipMeta] = useState({ page: 1, page_size: PAGE_SIZE, total: 0, total_pages: 1, total_net: 0 });
  const [listFilters, setListFilters] = useState({ q: "", year: "", month: "", jobGroup: "", status: "all" });
  const [listPage, setListPage] = useState(1);

  const selectedCompany = useMemo(() => companies.find((c) => String(c.id) === String(companyId)), [companies, companyId]);
  const companyEmployees = useMemo(() => employees.filter((e) => Number(e.company_id) === Number(companyId)), [employees, companyId]);
  const jobGroups = useMemo(() => [...new Set(companyEmployees.map((e) => String(e.job_group || "").trim()).filter(Boolean))].sort((a, b) => number(a) - number(b)), [companyEmployees]);
  const selectedEmployee = useMemo(() => companyEmployees.find((e) => String(e.id) === String(form.personnel_id)), [companyEmployees, form.personnel_id]);

  const calculation = useMemo(() => calculatePayroll1405({
    ...form,
    married: selectedEmployee?.marital_status === "married" || selectedEmployee?.marital_status === "متأهل",
    child_count: number(selectedEmployee?.children_count),
    work_days: number(form.work_days),
  }), [form, selectedEmployee]);

  async function loadCompanies() {
    try {
      setCompaniesLoading(true);
      const response = await fetch("/api/companies", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "خطا در دریافت شرکت‌ها");
      const list = Array.isArray(result.data) ? result.data : [];
      setCompanies(list);
      setCompanyId((current) => current && list.some((c) => String(c.id) === String(current)) ? current : list[0] ? String(list[0].id) : "");
    } catch (err) { setError(err.message || "خطا در دریافت شرکت‌ها"); }
    finally { setCompaniesLoading(false); }
  }

  async function loadData() {
    if (!companyId) {
      setEmployees([]); setPayslips([]);
      setPayslipMeta({ page: 1, page_size: PAGE_SIZE, total: 0, total_pages: 1, total_net: 0 });
      setLoading(false);
      return;
    }
    try {
      setLoading(true); setError("");
      const payslipParams = new URLSearchParams({
        company_id: String(companyId),
        page: String(listPage),
        page_size: String(PAGE_SIZE),
      });
      if (listFilters.q.trim()) payslipParams.set("q", listFilters.q.trim());
      if (listFilters.year) payslipParams.set("year", listFilters.year);
      if (listFilters.month) payslipParams.set("month", listFilters.month);
      if (listFilters.jobGroup) payslipParams.set("job_group", listFilters.jobGroup);
      if (listFilters.status !== "all") payslipParams.set("status", listFilters.status);

      const [empRes, payRes] = await Promise.all([
        fetch(`/api/personnel?company_id=${encodeURIComponent(companyId)}`, { cache: "no-store" }),
        fetch(`/api/payslips?${payslipParams.toString()}`, { cache: "no-store" }),
      ]);
      const [empData, payData] = await Promise.all([empRes.json(), payRes.json()]);
      if (!empRes.ok || !empData.success) throw new Error(empData.error || "خطا در دریافت کارکنان");
      if (!payRes.ok || !payData.success) throw new Error(payData.error || "خطا در دریافت فیش‌ها");
      setEmployees(Array.isArray(empData.data) ? empData.data : []);
      setPayslips(Array.isArray(payData.data) ? payData.data : []);
      setPayslipMeta({ page: payData.meta?.page || listPage, page_size: payData.meta?.page_size || PAGE_SIZE, total: Number(payData.meta?.total || 0), total_pages: Number(payData.meta?.total_pages || 1), total_net: payData.meta?.total_net || 0 });
    } catch (err) {
      setEmployees([]); setPayslips([]);
      setPayslipMeta({ page: 1, page_size: PAGE_SIZE, total: 0, total_pages: 1, total_net: 0 });
      setError(err.message || "خطا در دریافت اطلاعات");
    } finally { setLoading(false); }
  }

  useEffect(() => { setIsMounted(true); loadCompanies(); }, []);
  useEffect(() => { if (!companiesLoading) loadData(); }, [companyId, companiesLoading, listPage, listFilters]);

  function updateForm(field, value) { setForm((previous) => ({ ...previous, [field]: value })); }
  function resetForm() { setForm({ ...EMPTY_FORM, work_days: String(daysInPersianMonth(1405, 1)) }); setEditingId(null); }

  function handleCompanyChange(value) { if (editingId !== null) resetForm(); setListPage(1); setListFilters({ q: "", year: "", month: "", jobGroup: "", status: "all" }); setCompanyId(value); }

  function handleMonthChange(month) {
    const monthNumber = MONTHS.indexOf(month) + 1;
    const monthDays = daysInPersianMonth(Number(form.year || 1405), monthNumber);
    setForm((p) => ({ ...p, month, work_days: String(Math.min(number(p.work_days) || monthDays, monthDays)) }));
  }

  function handleEmployeeChange(value) {
    if (!value) { updateForm("personnel_id", ""); return; }
    const employee = companyEmployees.find((item) => String(item.id) === String(value));
    if (!employee) return;
    setForm((p) => ({ ...p, personnel_id: String(employee.id), bank_account: employee.bank_account || "", job_group: String(employee.job_group || ""), job_title: employee.job_title || "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!companyId || !selectedCompany) return alert("ابتدا شرکت را انتخاب کنید.");
    if (!selectedEmployee) return alert("لطفاً یک کارمند انتخاب کنید.");
    if (!calculation.jobGroup || calculation.groupDailyWage <= 0) return alert("گروه مزدی معتبر ۱ تا ۲۰ برای پرسنل ثبت نشده است.");
    if (calculation.workDays <= 0) return alert("تعداد روز کارکرد باید بیشتر از صفر باشد.");
    try {
      setSaving(true);
      const payload = {
        ...(editingId !== null ? { id: editingId } : {}),
        personnel_id: Number(form.personnel_id), year: form.year, month: form.month,
        bank_account: form.bank_account || selectedEmployee.bank_account || "",
        job_group: form.job_group, job_title: form.job_title,
        work_days: calculation.workDays, mission_days: calculation.missionDays, mission_hours: calculation.missionHours,
        seniority_eligible: Boolean(form.seniority_eligible), overtime: number(form.overtime), bonus: number(form.bonus),
        housing_allowance: number(form.housing_allowance), food_allowance: number(form.food_allowance), marriage_allowance: number(form.marriage_allowance),
        child_allowance: number(form.child_allowance), other_benefits: number(form.other_benefits), other_deductions: number(form.other_deductions),
      };
      const response = await fetch("/api/payslips", { method: editingId !== null ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "عملیات انجام نشد");
      alert(editingId !== null ? "فیش کامل با محاسبه خودکار به‌روزرسانی شد." : "فیش کامل با محاسبه خودکار صادر شد.");
      resetForm(); await loadData();
    } catch (err) { alert(err.message || "خطا در ثبت فیش"); }
    finally { setSaving(false); }
  }

  async function handleEdit(payslip) {
    try {
      setError("");
      const response = await fetch(`/api/payslips/${encodeURIComponent(payslip.id)}`, { cache: "no-store" });
      const result = await response.json();
      const detail = Array.isArray(result.data) ? result.data[0] : result.data;
      if (!response.ok || !result.success || !detail) throw new Error(result.error || "خطا در دریافت جزئیات فیش");
      setEditingId(detail.id);
      setForm({
        personnel_id: String(detail.personnel_id || ""), year: detail.year || "1405", month: paymentMonth(detail.month) || "فروردین",
        bank_account: detail.bank_account || "", job_group: String(detail.job_group || ""), job_title: detail.job_title || "",
        work_days: String(detail.work_days || 30), mission_days: String(detail.mission_days || 0), mission_hours: String(detail.mission_hours || 0),
        seniority_eligible: Boolean(detail.seniority_eligible), overtime: String(detail.overtime || ""), bonus: String(detail.bonus || ""),
        housing_allowance: String(detail.housing_allowance || ""), food_allowance: String(detail.food_allowance || ""), marriage_allowance: String(detail.marriage_allowance || ""),
        child_allowance: String(detail.child_allowance || ""), other_benefits: String(detail.other_benefits || ""), other_deductions: String(detail.other_deductions || ""),
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) { setError(err.message || "خطا در دریافت جزئیات فیش"); }
  }

  function updateListFilter(field, value) {
    setListFilters((current) => ({ ...current, [field]: value }));
    setListPage(1);
  }

  function resetListFilters() {
    setListFilters({ q: "", year: "", month: "", jobGroup: "", status: "all" });
    setListPage(1);
  }

  function goToPage(page) {
    setListPage(Math.min(Math.max(1, page), Math.max(1, payslipMeta.total_pages)));
  }

  function paginationItems(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
    const items = [1];
    if (current > 4) items.push("ellipsis-start");
    for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p += 1) items.push(p);
    if (current < total - 3) items.push("ellipsis-end");
    items.push(total);
    return [...new Set(items)];
  }

  async function handleDelete(id) {
    if (!window.confirm("آیا از حذف این فیش حقوقی مطمئن هستید؟")) return;
    try {
      const response = await fetch("/api/payslips", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "حذف انجام نشد");
      if (editingId === id) resetForm();
      await loadData();
    } catch (err) { alert(err.message || "خطا در حذف فیش"); }
  }

  if (!isMounted) return null;
  if (companiesLoading || loading) return <div className="payslips-page" dir="rtl"><div className="form-card" style={{ textAlign: "center", padding: 48 }}><div style={{ fontSize: 48 }}>💰</div><h2>در حال آماده‌سازی مدیریت فیش‌ها...</h2></div></div>;

  return (
    <div className="payslips-page" dir="rtl">
      <div className="payslips-header">
        <div className="page-title-row"><div className="title-icon">💰</div><div><h1>مدیریت فیش حقوقی</h1><p>پرسنل → گروه مزدی → کارکرد → مزایا → بیمه ۷٪ → مالیات → خالص پرداختی → فیش</p></div></div>
        <div className="header-badge">● {selectedCompany?.name || "شرکتی انتخاب نشده"}</div>
      </div>

      <div className="form-card" style={{ marginBottom: 24 }}>
        <div className="section-header"><div><h2>🏢 شرکت فعال</h2><p>صدور و مشاهده فیش فقط برای شرکت انتخاب‌شده انجام می‌شود.</p></div></div>
        <div className="form-group" style={{ maxWidth: 620 }}><label>انتخاب شرکت</label><select value={companyId} onChange={(e) => handleCompanyChange(e.target.value)}><option value="">انتخاب شرکت...</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon blue">📄</div><div><span>کل فیش‌ها</span><strong>{fa(payslipMeta.total)}</strong></div></div>
        <div className="stat-card"><div className="stat-icon green">👥</div><div><span>کارکنان شرکت</span><strong>{fa(companyEmployees.length)}</strong></div></div>
        <div className="stat-card"><div className="stat-icon orange">💵</div><div><span>مجموع خالص پرداختی</span><strong>{fa(payslipMeta.total_net)}</strong><small>{DISPLAY_CURRENCY}</small></div></div>
        <div className="stat-card"><div className="stat-icon purple">📅</div><div><span>ماه پرداخت</span><strong>{form.month}</strong><small>{form.year}</small></div></div>
      </div>

      <div className="form-card">
        <div className="section-header"><div><h2>{editingId !== null ? "ویرایش فیش کامل" : "صدور فیش کامل"}</h2><p>تمام ارقام پایه، مزایا و کسورات از موتور محاسبه ۱۴۰۵ عبور می‌کنند.</p></div><div className="section-icon">{editingId !== null ? "✏️" : "➕"}</div></div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group employee-field"><label>۱. پرسنل</label><select value={form.personnel_id} onChange={(e) => handleEmployeeChange(e.target.value)}><option value="">انتخاب پرسنل...</option>{companyEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.full_name || "بدون نام"} — {employee.personnel_code || "بدون کد"}</option>)}</select></div>
            <div className="form-group"><label>سال</label><input inputMode="numeric" value={form.year} onChange={(e) => updateForm("year", e.target.value)} /></div>
            <div className="form-group"><label>ماه</label><select value={form.month} onChange={(e) => handleMonthChange(e.target.value)}>{MONTHS.map((month) => <option key={month}>{month}</option>)}</select></div>
            <div className="form-group"><label>۲. گروه شغلی</label><input value={form.job_group} readOnly /><small>از پرونده پرسنل؛ حقوق پایه دستی نیست.</small></div>
            <div className="form-group"><label>عنوان شغلی</label><input value={form.job_title} readOnly /></div>
            <div className="form-group"><label>شماره حساب</label><input value={form.bank_account} onChange={(e) => updateForm("bank_account", e.target.value)} /></div>
            <div className="form-group"><label>۳. تعداد روز کارکرد</label><input type="number" min="1" max={31} value={form.work_days} onChange={(e) => updateForm("work_days", e.target.value)} /><small>حداکثر کارکرد: ۳۱ روز</small></div>
            <div className="form-group"><label>روز مأموریت</label><input type="number" min="0" max={calculation.workDays} value={form.mission_days} onChange={(e) => updateForm("mission_days", e.target.value)} /></div>
            <div className="form-group"><label>ساعت مأموریت</label><input type="number" min="0" step="0.25" value={form.mission_hours} onChange={(e) => updateForm("mission_hours", e.target.value)} /></div>
            <div className="form-group" style={{ display: "flex", alignItems: "end" }}><label style={{ display: "flex", gap: 10, alignItems: "center", width: "100%", padding: 13, borderRadius: 12, background: "#eff6ff", color: "#1d4ed8", cursor: "pointer" }}><input type="checkbox" checked={Boolean(form.seniority_eligible)} onChange={(e) => updateForm("seniority_eligible", e.target.checked)} /> پایه سنوات</label></div>
            <MoneyInput label="۴. اضافه‌کاری" value={form.overtime} onChange={(v) => updateForm("overtime", v)} />
            <MoneyInput label="پاداش" value={form.bonus} onChange={(v) => updateForm("bonus", v)} />
            <MoneyInput label="حق مسکن" value={form.housing_allowance} onChange={(v) => updateForm("housing_allowance", v)} />
            <MoneyInput label="بن خواربار" value={form.food_allowance} onChange={(v) => updateForm("food_allowance", v)} />
            <MoneyInput label="حق تأهل" value={form.marriage_allowance} onChange={(v) => updateForm("marriage_allowance", v)} />
            <MoneyInput label="حق اولاد" value={form.child_allowance} onChange={(v) => updateForm("child_allowance", v)} />
            <MoneyInput label="سایر مزایا" value={form.other_benefits} onChange={(v) => updateForm("other_benefits", v)} />
            <MoneyInput label="سایر کسورات" value={form.other_deductions} onChange={(v) => updateForm("other_deductions", v)} deduction />
          </div>

          <div style={{ margin: "18px 0", padding: 18, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: 800, marginBottom: 12 }}>🧮 محاسبه زنده فیش</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
              <Calc label="مزد روزانه گروه" value={calculation.groupDailyWage} />
              <Calc label="حقوق پایه" value={calculation.baseSalary} />
              <Calc label="سنوات جاری" value={calculation.seniorityAllowance} />
              <Calc label="مزد سنوات سال‌های گذشته" value={calculation.pastSeniorityAllowance} positive />
              <Calc label="جمع مزایا" value={calculation.totalBenefits} positive />
              <Calc label="مبنای بیمه" value={calculation.insuranceBase} />
              <Calc label="بیمه ۷٪" value={calculation.insurance} negative />
              <Calc label="درآمد مشمول مالیات" value={calculation.taxableIncome} />
              <Calc label="مالیات" value={calculation.tax} negative />
              <Calc label="جمع ناخالص" value={calculation.grossSalary} />
              <Calc label="خالص پرداختی" value={calculation.netSalary} strong />
            </div>
            <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: "#ecfdf5", color: "#047857", fontWeight: 700 }}>مزد سنوات سال‌های گذشته به‌صورت خودکار با نرخ روزانه ۱٬۶۵۸٬۸۴۸ ریال محاسبه و وارد ناخالص، مبنای بیمه و مالیات می‌شود.</div>
          </div>

          <div className="form-actions"><button type="submit" disabled={saving || !companyId} className="submit-button">{saving ? "در حال ذخیره..." : editingId !== null ? "✓ ذخیره فیش" : "✓ ثبت و صدور فیش"}</button>{editingId !== null && <button type="button" onClick={resetForm} className="back-button">لغو ویرایش</button>}</div>
        </form>
      </div>

      <div className="payslip-list-filters form-card">
        <div className="section-header" style={{ marginBottom: 16 }}><div><h2>🔎 فیلتر فیش‌ها</h2><p>برای شرکت فعال جستجو، ماه، گروه و وضعیت دوره را محدود کنید.</p></div><button type="button" onClick={resetListFilters} className="back-button" style={{ minHeight: 40 }}>پاک‌کردن فیلترها</button></div>
        <div className="payslip-filter-grid">
          <div className="form-group"><label>جستجوی نام / کد / شماره فیش</label><input value={listFilters.q} onChange={(e) => updateListFilter("q", e.target.value)} placeholder="مثلاً اسماعیل احمدی" /></div>
          <div className="form-group"><label>سال پرداخت</label><select value={listFilters.year} onChange={(e) => updateListFilter("year", e.target.value)}><option value="">همه سال‌ها</option><option value="1405">۱۴۰۵</option></select></div>
          <div className="form-group"><label>ماه پرداخت</label><select value={listFilters.month} onChange={(e) => updateListFilter("month", e.target.value)}><option value="">همه ماه‌ها</option>{MONTHS.map((month) => <option key={month} value={month}>{month}</option>)}</select></div>
          <div className="form-group"><label>گروه</label><select value={listFilters.jobGroup} onChange={(e) => updateListFilter("jobGroup", e.target.value)}><option value="">همه گروه‌ها</option>{jobGroups.map((group) => <option key={group} value={group}>{group}</option>)}</select></div>
          <div className="form-group"><label>وضعیت دوره</label><select value={listFilters.status} onChange={(e) => updateListFilter("status", e.target.value)}><option value="all">همه</option><option value="open">باز</option><option value="closed">بسته</option></select></div>
        </div>
      </div>

      <div className="table-card">
        <div className="section-header table-header">
          <div><h2>فیش‌های صادرشده</h2><p>نمایش مدیریتی فیش‌ها؛ جزئیات مالی داخل صفحه مشاهده فیش است.</p></div>
          <span className="count-badge">{fa(payslipMeta.total)} فیش</span>
        </div>
        {error && <div style={{ margin: "0 20px 16px", padding: 12, borderRadius: 10, background: "#fef2f2", color: "#b91c1c" }}>{error}</div>}
        <div className="payslip-list-grid">
          {payslips.length === 0 ? (
            <div className="payslip-list-empty">
              برای این فیلتر فیشی پیدا نشد.
            </div>
          ) : payslips.map((p, index) => (
            <article key={p.id} className="payslip-card">
              <div className="payslip-card-top">
                <div className="payslip-card-employee">
                  <span className="payslip-card-index">{fa((payslipMeta.page - 1) * payslipMeta.page_size + index + 1)}</span>
                  <div>
                    <div className="payslip-card-name">{p.full_name || "نامشخص"}</div>
                    {p.personnel_code && <div className="employee-code">{p.personnel_code}</div>}
                  </div>
                </div>
                <div className="payslip-card-actions">
                  <a href={`/admin/payslips/${p.id}`} className="view-button">👁 مشاهده</a>
                  <button type="button" title="ویرایش" aria-label="ویرایش" onClick={() => handleEdit(p)} className="action-edit">✏️</button>
                  <button type="button" title="حذف" aria-label="حذف" onClick={() => handleDelete(p.id)} className="action-delete">🗑</button>
                </div>
              </div>

              <div className="payslip-card-meta">
                <span>گروه {p.job_group || "---"}</span>
                <span>{paymentMonth(p.month)} {formatYear(p.year)}</span>
                <span>کارکرد {fa(p.work_days)} روز</span>
              </div>

              <div className="payslip-card-finance">
                <div><span>حقوق پایه</span><strong>{fa(p.base_salary)} {DISPLAY_CURRENCY}</strong></div>
                <div><span>بیمه</span><strong>{fa(p.insurance)} {DISPLAY_CURRENCY}</strong></div>
                <div><span>مالیات</span><strong>{fa(p.tax)} {DISPLAY_CURRENCY}</strong></div>
                <div className="payslip-card-net"><span>خالص</span><strong>{fa(p.net_salary)} {DISPLAY_CURRENCY}</strong></div>
              </div>
            </article>
          ))}
        </div>
        {payslipMeta.total > 0 && (
          <div className="payslip-pagination">
            <div className="pagination-summary">{fa(payslipMeta.total)} فیش — صفحه {fa(payslipMeta.page)} از {fa(payslipMeta.total_pages)}</div>
            <div className="pagination-controls">
              <button type="button" onClick={() => goToPage(listPage - 1)} disabled={listPage <= 1}>◀ قبلی</button>
              {paginationItems(listPage, payslipMeta.total_pages).map((item) => item.toString().startsWith("ellipsis") ? (
                <span key={item} className="pagination-ellipsis">…</span>
              ) : (
                <button type="button" key={item} onClick={() => goToPage(item)} className={item === listPage ? "active" : ""}>{fa(item)}</button>
              ))}
              <button type="button" onClick={() => goToPage(listPage + 1)} disabled={listPage >= payslipMeta.total_pages}>بعدی ▶</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MoneyInput({ label, value, onChange, deduction = false }) { return <div className="form-group"><label>{label}</label><div className={`input-with-label ${deduction ? "deduction" : ""}`}><input type="number" min="0" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0" /><span>{DISPLAY_CURRENCY}</span></div></div>; }
function Calc({ label, value, positive = false, negative = false, strong = false }) { return <div style={{ padding: 12, borderRadius: 10, background: strong ? "#eef2ff" : "#fff", border: "1px solid #e2e8f0" }}><span style={{ display: "block", color: "#64748b", fontSize: 13 }}>{label}</span><strong style={{ color: negative ? "#dc2626" : positive ? "#059669" : strong ? "#4338ca" : "#0f172a", fontSize: strong ? 19 : 15 }}>{fa(value)} {DISPLAY_CURRENCY}</strong></div>; }
