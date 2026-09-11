"use client";

import "./payslips.css";
import { useEffect, useMemo, useState } from "react";

const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const STANDARD_HOURS_PER_DAY = 7.33;
const DEFAULT_SENIORITY_DAILY_RATE = 16667;

const EMPTY_FORM = {
  personnel_id: "", year: "1405", month: "فروردین", bank_account: "", job_group: "", job_title: "",
  base_salary: "", work_days: "30", mission_days: "0", mission_hours: "0", seniority_eligible: false,
  overtime: "", bonus: "", housing_allowance: "", food_allowance: "", marriage_allowance: "", child_allowance: "", other_benefits: "",
  insurance: "", tax: "", other_deductions: "",
};

function number(value) { const n = Number(value); return Number.isFinite(n) ? n : 0; }
function clamp(value, min, max) { return Math.min(max, Math.max(min, number(value))); }

export default function PayslipsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [employees, setEmployees] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [calculationSettings, setCalculationSettings] = useState({ currency: "تومان", seniority_daily_rate: DEFAULT_SENIORITY_DAILY_RATE });

  const selectedCompany = useMemo(() => companies.find((c) => String(c.id) === String(companyId)), [companies, companyId]);
  const companyEmployees = useMemo(() => employees.filter((e) => Number(e.company_id) === Number(companyId)), [employees, companyId]);

  const base = number(form.base_salary);
  const workDays = clamp(form.work_days || 30, 1, 31);
  const missionDays = clamp(form.mission_days, 0, workDays);
  const missionHours = clamp(form.mission_hours, 0, Math.max(workDays * 24, 24));
  const dailyWage = workDays > 0 ? base / workDays : 0;
  const hourlyWage = dailyWage / STANDARD_HOURS_PER_DAY;
  const mission = missionDays * dailyWage + missionHours * hourlyWage;
  const seniorityDailyRate = number(calculationSettings.seniority_daily_rate) || DEFAULT_SENIORITY_DAILY_RATE;
  const seniority = form.seniority_eligible ? workDays * seniorityDailyRate : 0;
  const overtime = number(form.overtime), bonus = number(form.bonus);
  const housing = number(form.housing_allowance), food = number(form.food_allowance), marriage = number(form.marriage_allowance), child = number(form.child_allowance), otherBenefits = number(form.other_benefits);
  const insurance = number(form.insurance), tax = number(form.tax), otherDeductions = number(form.other_deductions);
  const totalBenefits = overtime + bonus + seniority + mission + housing + food + marriage + child + otherBenefits;
  const totalDeductions = insurance + tax + otherDeductions;
  const netSalary = base + totalBenefits - totalDeductions;

  async function loadCompanies() {
    try {
      setCompaniesLoading(true);
      const response = await fetch("/api/companies", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "خطا در دریافت شرکت‌ها");
      const list = Array.isArray(result.data) ? result.data : [];
      setCompanies(list);
      setCompanyId((current) => current && list.some((c) => String(c.id) === String(current)) ? current : list.length ? String(list[0].id) : "");
    } catch (err) { console.error(err); setError(err.message || "خطا در دریافت شرکت‌ها"); }
    finally { setCompaniesLoading(false); }
  }

  async function loadCalculationSettings() {
    try {
      const response = await fetch("/api/settings", { cache: "no-store" });
      const result = await response.json();
      if (response.ok && result.success && result.data) setCalculationSettings(result.data);
    } catch (err) { console.error("Calculation settings error:", err); }
  }

  async function loadData() {
    if (!companyId) { setEmployees([]); setPayslips([]); setLoading(false); return; }
    try {
      setLoading(true); setError("");
      const [empRes, payRes] = await Promise.all([
        fetch("/api/personnel", { cache: "no-store" }),
        fetch(`/api/payslips?company_id=${encodeURIComponent(companyId)}`, { cache: "no-store" }),
      ]);
      const [empData, payData] = await Promise.all([empRes.json(), payRes.json()]);
      if (!empRes.ok || !empData.success) throw new Error(empData.error || "خطا در دریافت کارکنان");
      if (!payRes.ok || !payData.success) throw new Error(payData.error || "خطا در دریافت فیش‌ها");
      setEmployees(Array.isArray(empData.data) ? empData.data : []);
      setPayslips(Array.isArray(payData.data) ? payData.data : []);
    } catch (err) { console.error(err); setEmployees([]); setPayslips([]); setError(err.message || "خطا در دریافت اطلاعات"); }
    finally { setLoading(false); }
  }

  useEffect(() => { setIsMounted(true); loadCompanies(); loadCalculationSettings(); }, []);
  useEffect(() => { if (!companiesLoading) loadData(); }, [companyId, companiesLoading]);

  function updateForm(field, value) { setForm((previous) => ({ ...previous, [field]: value })); }
  function handleCompanyChange(value) { if (editingId !== null) resetForm(); setCompanyId(value); }
  function handleEmployeeChange(value) {
    if (!value) { setForm((p) => ({ ...p, personnel_id: "", bank_account: "", job_group: "", job_title: "" })); return; }
    const employee = companyEmployees.find((item) => String(item.id) === String(value));
    if (!employee) return;
    setForm((p) => ({ ...p, personnel_id: String(employee.id), bank_account: employee.bank_account || "", job_group: employee.job_group || "", job_title: employee.job_title || "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!companyId || !selectedCompany) { alert("ابتدا شرکت را انتخاب کنید."); return; }
    if (!form.personnel_id) { alert("لطفاً یک کارمند از شرکت انتخاب‌شده را انتخاب کنید."); return; }
    const employee = companyEmployees.find((item) => String(item.id) === String(form.personnel_id));
    if (!employee || Number(employee.company_id) !== Number(companyId)) { alert("کارمند انتخاب‌شده متعلق به شرکت فعال نیست."); return; }
    if (!form.base_salary || base <= 0) { alert("لطفاً حقوق پایه را وارد کنید."); return; }
    try {
      setSaving(true);
      const isEditing = editingId !== null;
      const response = await fetch("/api/payslips", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing ? { id: editingId } : {}), personnel_id: Number(form.personnel_id), year: form.year, month: form.month,
          bank_account: form.bank_account, job_group: form.job_group, job_title: form.job_title, base_salary: base,
          work_days: workDays, mission_days: missionDays, mission_hours: missionHours, seniority_eligible: Boolean(form.seniority_eligible),
          overtime, bonus, housing_allowance: housing, food_allowance: food, marriage_allowance: marriage, child_allowance: child, other_benefits: otherBenefits,
          insurance, tax, other_deductions: otherDeductions, net_salary: netSalary,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) { alert(result.error || result.message || "عملیات انجام نشد"); return; }
      alert(isEditing ? "فیش حقوقی با محاسبه خودکار ویرایش شد." : "فیش حقوقی با محاسبه خودکار صادر شد.");
      resetForm(); await loadData();
    } catch (err) { console.error(err); alert("خطا در اتصال به سرور"); }
    finally { setSaving(false); }
  }

  function handleEdit(payslip) {
    if (Number(payslip.company_id) !== Number(companyId)) { alert("این فیش متعلق به شرکت فعال نیست."); return; }
    setEditingId(payslip.id);
    setForm({
      personnel_id: String(payslip.personnel_id || ""), year: payslip.year || "1405", month: payslip.month || "فروردین",
      bank_account: payslip.bank_account || "", job_group: payslip.job_group || "", job_title: payslip.job_title || "",
      base_salary: payslip.base_salary || "", work_days: payslip.work_days || "30", mission_days: payslip.mission_days || "0", mission_hours: payslip.mission_hours || "0", seniority_eligible: Boolean(payslip.seniority_eligible),
      overtime: payslip.overtime || "", bonus: payslip.bonus || "", housing_allowance: payslip.housing_allowance || "", food_allowance: payslip.food_allowance || "", marriage_allowance: payslip.marriage_allowance || "", child_allowance: payslip.child_allowance || "", other_benefits: payslip.other_benefits || "", insurance: payslip.insurance || "", tax: payslip.tax || "", other_deductions: payslip.other_deductions || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!window.confirm("آیا از حذف این فیش حقوقی مطمئن هستید؟\n\nاین عملیات قابل بازگشت نیست.")) return;
    try {
      const response = await fetch("/api/payslips", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const result = await response.json();
      if (!response.ok || !result.success) { alert(result.error || result.message || "حذف فیش انجام نشد"); return; }
      alert("فیش حقوقی با موفقیت حذف شد.");
      if (editingId === id) resetForm();
      await loadData();
    } catch (err) { console.error(err); alert("خطا در اتصال به سرور"); }
  }

  function resetForm() { setForm({ ...EMPTY_FORM }); setEditingId(null); }
  if (!isMounted) return null;
  if (companiesLoading || loading) return <div className="payslips-page" dir="rtl"><div className="form-card" style={{ textAlign: "center", padding: "48px" }}><div style={{ fontSize: 48 }}>💰</div><h2>در حال آماده‌سازی مدیریت فیش‌ها...</h2><p>اطلاعات فقط برای شرکت انتخاب‌شده دریافت می‌شود.</p></div></div>;
  if (error && !selectedCompany) return <div className="payslips-page" dir="rtl"><div className="form-card" style={{ textAlign: "center", padding: "48px" }}><div style={{ fontSize: 48 }}>⚠️</div><h2>دریافت اطلاعات ناموفق بود</h2><p style={{ color: "#dc2626" }}>{error}</p><button type="button" className="submit-button" onClick={loadCompanies}>تلاش مجدد</button></div></div>;

  return (
    <div className="payslips-page" dir="rtl">
      <div className="payslips-header"><div className="page-title-row"><div className="title-icon">💰</div><div><h1>مدیریت فیش حقوقی</h1><p>ثبت، صدور و مشاهده فیش حقوق کارکنان شرکت انتخاب‌شده</p></div></div><div className="header-badge"><span>●</span> {selectedCompany ? selectedCompany.name : "شرکتی انتخاب نشده"}</div></div>
      <div className="form-card" style={{ marginBottom: 24 }}><div className="section-header"><div><h2>🏢 شرکت فعال</h2><p>تمام عملیات فیش حقوقی در این صفحه فقط برای شرکت انتخاب‌شده انجام می‌شود.</p></div></div><div className="form-group" style={{ maxWidth: 620 }}><label>انتخاب شرکت</label><select value={companyId} onChange={(e) => handleCompanyChange(e.target.value)}><option value="">انتخاب شرکت...</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></div>{selectedCompany && <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 10, background: "#eff6ff", color: "#1d4ed8", fontWeight: 600 }}>گزارش و فیش‌های قابل مشاهده: <strong>{selectedCompany.name}</strong></div>}</div>
      <div className="stats-grid"><div className="stat-card"><div className="stat-icon blue">📄</div><div><span>کل فیش‌های این شرکت</span><strong>{payslips.length.toLocaleString("fa-IR")}</strong></div></div><div className="stat-card"><div className="stat-icon green">👥</div><div><span>کارکنان این شرکت</span><strong>{companyEmployees.length.toLocaleString("fa-IR")}</strong></div></div><div className="stat-card"><div className="stat-icon orange">💵</div><div><span>مجموع خالص پرداختی</span><strong>{payslips.reduce((sum, item) => sum + number(item.net_salary), 0).toLocaleString("fa-IR")}</strong><small>{calculationSettings.currency || "تومان"}</small></div></div><div className="stat-card"><div className="stat-icon purple">📅</div><div><span>دوره جاری</span><strong>{form.year}</strong><small>{form.month}</small></div></div></div>
      <div className="form-card"><div className="section-header"><div><h2>{editingId !== null ? "ویرایش فیش حقوقی" : "صدور فیش جدید"}</h2><p>{editingId !== null ? `اصلاح فیش ${selectedCompany?.name || "شرکت"}` : `صدور فیش برای کارکنان ${selectedCompany?.name || "شرکت"}`}</p></div><div className="section-icon">{editingId !== null ? "✏️" : "➕"}</div></div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group employee-field"><label>انتخاب کارمند</label><select value={form.personnel_id} onChange={(e) => handleEmployeeChange(e.target.value)}><option value="">انتخاب کارمند...</option>{companyEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.full_name || "بدون نام"} — {employee.personnel_code || "بدون کد"}</option>)}</select></div>
            <div className="form-group"><label>سال</label><input type="text" inputMode="numeric" value={form.year} onChange={(e) => updateForm("year", e.target.value)} /></div>
            <div className="form-group"><label>ماه</label><select value={form.month} onChange={(e) => updateForm("month", e.target.value)}>{MONTHS.map((month) => <option key={month} value={month}>{month}</option>)}</select></div>
            <div className="form-group"><label>شماره حساب</label><input type="text" value={form.bank_account} onChange={(e) => updateForm("bank_account", e.target.value)} placeholder="شماره حساب" /></div>
            <div className="form-group"><label>گروه شغلی</label><input type="text" value={form.job_group} onChange={(e) => updateForm("job_group", e.target.value)} placeholder="مثلاً گروه ۸" /></div>
            <div className="form-group"><label>عنوان شغلی</label><input type="text" value={form.job_title} onChange={(e) => updateForm("job_title", e.target.value)} placeholder="عنوان شغلی" /></div>
            <MoneyInput label="حقوق پایه" value={form.base_salary} onChange={(v) => updateForm("base_salary", v)} />
            <div className="form-group"><label>روزهای کارکرد</label><input type="number" min="1" max="31" value={form.work_days} onChange={(e) => updateForm("work_days", e.target.value)} /><small>مبنای محاسبه روزانه و سنوات</small></div>
            <div className="form-group"><label>روز مأموریت</label><input type="number" min="0" max={workDays} value={form.mission_days} onChange={(e) => updateForm("mission_days", e.target.value)} /></div>
            <div className="form-group"><label>ساعت مأموریت</label><input type="number" min="0" max={Math.max(workDays * 24, 24)} step="0.25" value={form.mission_hours} onChange={(e) => updateForm("mission_hours", e.target.value)} /></div>
            <div className="form-group" style={{ display: "flex", alignItems: "end" }}><label style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "13px 14px", borderRadius: 12, background: "#eff6ff", color: "#1d4ed8", cursor: "pointer" }}><input type="checkbox" checked={Boolean(form.seniority_eligible)} onChange={(e) => updateForm("seniority_eligible", e.target.checked)} /> مشمول پایه سنوات</label></div>
            <MoneyInput label="اضافه کاری" value={form.overtime} onChange={(v) => updateForm("overtime", v)} />
            <MoneyInput label="پاداش" value={form.bonus} onChange={(v) => updateForm("bonus", v)} />
            <MoneyInput label="حق مسکن" value={form.housing_allowance} onChange={(v) => updateForm("housing_allowance", v)} />
            <MoneyInput label="بن خواربار" value={form.food_allowance} onChange={(v) => updateForm("food_allowance", v)} />
            <MoneyInput label="حق تأهل" value={form.marriage_allowance} onChange={(v) => updateForm("marriage_allowance", v)} />
            <MoneyInput label="حق اولاد" value={form.child_allowance} onChange={(v) => updateForm("child_allowance", v)} />
            <MoneyInput label="سایر مزایا" value={form.other_benefits} onChange={(v) => updateForm("other_benefits", v)} />
            <MoneyInput label="حق بیمه" value={form.insurance} onChange={(v) => updateForm("insurance", v)} deduction />
            <MoneyInput label="مالیات" value={form.tax} onChange={(v) => updateForm("tax", v)} deduction />
            <MoneyInput label="سایر کسورات" value={form.other_deductions} onChange={(v) => updateForm("other_deductions", v)} deduction />
          </div>
          <div style={{ margin: "18px 0", padding: "16px", borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>⚙️ محاسبه خودکار</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, color: "#475569" }}>
              <div>مزد روزانه: <strong>{dailyWage.toLocaleString("fa-IR")} {calculationSettings.currency || "تومان"}</strong></div>
              <div>مزد ساعتی: <strong>{hourlyWage.toLocaleString("fa-IR")} {calculationSettings.currency || "تومان"}</strong></div>
              <div>مبلغ مأموریت: <strong style={{ color: "#2563eb" }}>{mission.toLocaleString("fa-IR")} {calculationSettings.currency || "تومان"}</strong></div>
              <div>سنوات روزانه: <strong>{seniorityDailyRate.toLocaleString("fa-IR")} {calculationSettings.currency || "تومان"}</strong></div>
              <div>مبلغ سنوات: <strong style={{ color: "#059669" }}>{seniority.toLocaleString("fa-IR")} {calculationSettings.currency || "تومان"}</strong></div>
            </div>
            <small style={{ display: "block", marginTop: 10, color: "#64748b" }}>مأموریت بر پایه مزد روزانه و ساعتی محاسبه می‌شود؛ پایه سنوات نیز بر اساس روزهای کارکرد و نرخ روز سنوات سامانه محاسبه می‌شود.</small>
          </div>
          <div className="salary-summary"><div className="summary-item"><span>حقوق پایه</span><strong>{base.toLocaleString("fa-IR")} تومان</strong></div><div className="summary-item"><span>مجموع مزایا</span><strong className="positive">{totalBenefits.toLocaleString("fa-IR")} تومان</strong></div><div className="summary-item"><span>مجموع کسورات</span><strong className="negative">{totalDeductions.toLocaleString("fa-IR")} تومان</strong></div><div className="net-summary"><span>خالص پرداختی</span><strong>{netSalary.toLocaleString("fa-IR")}</strong><small>تومان</small></div></div>
          <div className="form-actions"><button type="submit" disabled={saving || !companyId} className="submit-button">{saving ? "در حال ذخیره..." : editingId !== null ? "✓ ذخیره تغییرات" : "✓ ثبت و صدور فیش حقوقی"}</button>{editingId !== null && <button type="button" onClick={resetForm} className="back-button">لغو ویرایش</button>}</div>
        </form>
      </div>
      <div className="table-card"><div className="section-header table-header"><div><h2>فیش‌های صادر شده</h2><p>لیست فیش‌های صادرشده فقط برای {selectedCompany?.name}</p></div><span className="count-badge">{payslips.length.toLocaleString("fa-IR")} فیش</span></div>{error && <div style={{ margin: "0 20px 16px", padding: 12, borderRadius: 10, background: "#fef2f2", color: "#b91c1c" }}>{error}</div>}<div className="table-wrapper"><table><thead><tr><th>#</th><th>کارمند</th><th>کد پرسنلی</th><th>شرکت</th><th>دوره</th><th>حقوق پایه</th><th>مأموریت</th><th>سنوات</th><th>خالص پرداختی</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>{payslips.length === 0 ? <tr><td colSpan="11" className="empty-cell">برای این شرکت هنوز فیشی صادر نشده است.</td></tr> : payslips.map((payslip, index) => <tr key={payslip.id}><td>{index + 1}</td><td className="employee-name">{payslip.full_name || "نامشخص"}</td><td>{payslip.personnel_code || "---"}</td><td>{payslip.company_name || selectedCompany?.name || "---"}</td><td>{payslip.month} {payslip.year}</td><td>{number(payslip.base_salary).toLocaleString("fa-IR")} تومان</td><td>{number(payslip.mission_allowance).toLocaleString("fa-IR")} تومان</td><td>{number(payslip.seniority_allowance).toLocaleString("fa-IR")} تومان</td><td className="net-value">{number(payslip.net_salary).toLocaleString("fa-IR")} تومان</td><td><span className="status-badge">صادر شده</span></td><td><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><a href={`/admin/payslips/${payslip.id}`} className="view-button">👁 مشاهده</a><button type="button" onClick={() => handleEdit(payslip)} style={{ border: "none", cursor: "pointer", padding: "8px 12px", borderRadius: 8, background: "#f59e0b", color: "#fff" }}>✏️ ویرایش</button><button type="button" onClick={() => handleDelete(payslip.id)} style={{ border: "none", cursor: "pointer", padding: "8px 12px", borderRadius: 8, background: "#ef4444", color: "#fff" }}>🗑 حذف</button></div></td></tr>)}</tbody></table></div></div>
    </div>
  );
}

function MoneyInput({ label, value, onChange, deduction = false }) {
  return <div className="form-group"><label>{label}</label><div className={`input-with-label ${deduction ? "deduction" : ""}`}><input type="number" min="0" value={value} onChange={(event) => onChange(event.target.value)} placeholder="0" /><span>تومان</span></div></div>;
}
