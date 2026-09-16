"use client";

import "./payslips.css";
import { useEffect, useMemo, useState } from "react";
import { calculatePayroll1405, daysInPersianMonth } from "../../lib/payroll-1405";

const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const DISPLAY_CURRENCY = "ریال";
const EMPTY_FORM = {
  personnel_id: "", year: "1405", month: "فروردین", bank_account: "", job_group: "", job_title: "",
  work_days: "31", mission_days: "0", mission_hours: "0", seniority_eligible: false,
  overtime: "", bonus: "", housing_allowance: "", food_allowance: "", marriage_allowance: "", child_allowance: "", other_benefits: "",
  other_deductions: "",
};

const number = (value) => { const n = Number(value); return Number.isFinite(n) ? n : 0; };
const fa = (value) => number(value).toLocaleString("fa-IR");

export default function PayslipsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [companies, setCompanies] = useState([]), [companyId, setCompanyId] = useState("");
  const [employees, setEmployees] = useState([]), [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true), [companiesLoading, setCompaniesLoading] = useState(true), [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null), [error, setError] = useState("");
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const selectedCompany = useMemo(() => companies.find((c) => String(c.id) === String(companyId)), [companies, companyId]);
  const companyEmployees = useMemo(() => employees.filter((e) => Number(e.company_id) === Number(companyId)), [employees, companyId]);
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
    if (!companyId) { setEmployees([]); setPayslips([]); setLoading(false); return; }
    try {
      setLoading(true); setError("");
      const [empRes, payRes] = await Promise.all([
        fetch(`/api/personnel?company_id=${encodeURIComponent(companyId)}`, { cache: "no-store" }),
        fetch(`/api/payslips?company_id=${encodeURIComponent(companyId)}`, { cache: "no-store" }),
      ]);
      const [empData, payData] = await Promise.all([empRes.json(), payRes.json()]);
      if (!empRes.ok || !empData.success) throw new Error(empData.error || "خطا در دریافت کارکنان");
      if (!payRes.ok || !payData.success) throw new Error(payData.error || "خطا در دریافت فیش‌ها");
      setEmployees(Array.isArray(empData.data) ? empData.data : []);
      setPayslips(Array.isArray(payData.data) ? payData.data : []);
    } catch (err) { setEmployees([]); setPayslips([]); setError(err.message || "خطا در دریافت اطلاعات"); }
    finally { setLoading(false); }
  }

  useEffect(() => { setIsMounted(true); loadCompanies(); }, []);
  useEffect(() => { if (!companiesLoading) loadData(); }, [companyId, companiesLoading]);

  function updateForm(field, value) { setForm((previous) => ({ ...previous, [field]: value })); }
  function resetForm() { setForm({ ...EMPTY_FORM, work_days: String(daysInPersianMonth(1405, 1)) }); setEditingId(null); }

  function handleCompanyChange(value) { if (editingId !== null) resetForm(); setCompanyId(value); }

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

  function handleEdit(payslip) {
    setEditingId(payslip.id);
    setForm({
      personnel_id: String(payslip.personnel_id || ""), year: payslip.year || "1405", month: payslip.month || "فروردین",
      bank_account: payslip.bank_account || "", job_group: String(payslip.job_group || ""), job_title: payslip.job_title || "",
      work_days: String(payslip.work_days || 30), mission_days: String(payslip.mission_days || 0), mission_hours: String(payslip.mission_hours || 0),
      seniority_eligible: Boolean(payslip.seniority_eligible), overtime: String(payslip.overtime || ""), bonus: String(payslip.bonus || ""),
      housing_allowance: String(payslip.housing_allowance || ""), food_allowance: String(payslip.food_allowance || ""), marriage_allowance: String(payslip.marriage_allowance || ""),
      child_allowance: String(payslip.child_allowance || ""), other_benefits: String(payslip.other_benefits || ""), other_deductions: String(payslip.other_deductions || ""),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        <div className="stat-card"><div className="stat-icon blue">📄</div><div><span>کل فیش‌ها</span><strong>{fa(payslips.length)}</strong></div></div>
        <div className="stat-card"><div className="stat-icon green">👥</div><div><span>کارکنان شرکت</span><strong>{fa(companyEmployees.length)}</strong></div></div>
        <div className="stat-card"><div className="stat-icon orange">💵</div><div><span>مجموع خالص پرداختی</span><strong>{fa(payslips.reduce((sum, item) => sum + number(item.net_salary), 0))}</strong><small>{DISPLAY_CURRENCY}</small></div></div>
        <div className="stat-card"><div className="stat-icon purple">📅</div><div><span>دوره</span><strong>{form.year}</strong><small>{form.month}</small></div></div>
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

      <div className="table-card"><div className="section-header table-header"><div><h2>فیش‌های صادرشده</h2><p>نتیجه نهایی پس از محاسبه کامل حقوق</p></div><span className="count-badge">{fa(payslips.length)} فیش</span></div>
        {error && <div style={{ margin: "0 20px 16px", padding: 12, borderRadius: 10, background: "#fef2f2", color: "#b91c1c" }}>{error}</div>}
        <div className="table-wrapper"><table><thead><tr><th>#</th><th>کارمند</th><th>گروه</th><th>دوره</th><th>روز کارکرد</th><th>حقوق پایه</th><th>بیمه</th><th>مالیات</th><th>خالص</th><th>عملیات</th></tr></thead><tbody>{payslips.length === 0 ? <tr><td colSpan="10" className="empty-cell">برای این شرکت هنوز فیشی صادر نشده است.</td></tr> : payslips.map((p, index) => <tr key={p.id}><td>{index + 1}</td><td className="employee-name">{p.full_name || "نامشخص"}</td><td>{p.job_group || "---"}</td><td>{p.month} {p.year}</td><td>{fa(p.work_days)}</td><td>{fa(p.base_salary)} {DISPLAY_CURRENCY}</td><td>{fa(p.insurance)} {DISPLAY_CURRENCY}</td><td>{fa(p.tax)} {DISPLAY_CURRENCY}</td><td className="net-value">{fa(p.net_salary)} {DISPLAY_CURRENCY}</td><td><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><a href={`/admin/payslips/${p.id}`} className="view-button">👁 مشاهده</a><button type="button" onClick={() => handleEdit(p)} style={{ border: "none", cursor: "pointer", padding: "8px 12px", borderRadius: 8, background: "#f59e0b", color: "#fff" }}>✏️</button><button type="button" onClick={() => handleDelete(p.id)} style={{ border: "none", cursor: "pointer", padding: "8px 12px", borderRadius: 8, background: "#ef4444", color: "#fff" }}>🗑</button></div></td></tr>)}</tbody></table></div>
      </div>
    </div>
  );
}

function MoneyInput({ label, value, onChange, deduction = false }) { return <div className="form-group"><label>{label}</label><div className={`input-with-label ${deduction ? "deduction" : ""}`}><input type="number" min="0" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0" /><span>{DISPLAY_CURRENCY}</span></div></div>; }
function Calc({ label, value, positive = false, negative = false, strong = false }) { return <div style={{ padding: 12, borderRadius: 10, background: strong ? "#eef2ff" : "#fff", border: "1px solid #e2e8f0" }}><span style={{ display: "block", color: "#64748b", fontSize: 13 }}>{label}</span><strong style={{ color: negative ? "#dc2626" : positive ? "#059669" : strong ? "#4338ca" : "#0f172a", fontSize: strong ? 19 : 15 }}>{fa(value)} {DISPLAY_CURRENCY}</strong></div>; }
