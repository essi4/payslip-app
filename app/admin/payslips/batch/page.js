"use client";

import { useEffect, useMemo, useState } from "react";
import { PAYROLL_1405_GROUP_OPTIONS, PAYROLL_1405_GROUP_WAGE_TABLE } from "../../../lib/payroll-1405-groups";

const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const CURRENCY = "ریال";
const emptyRow = (employee) => ({ personnel_id: employee.id, job_group: String(employee.job_group || ""), base_salary: "", work_days: "30", mission_days: "0", mission_hours: "0", seniority_eligible: false, overtime_hours: "0", bonus: "0", married: false, child_count: "0", other_benefits: "0", other_deductions: "0" });
const money = (n) => Number(n || 0).toLocaleString("fa-IR");

export default function BatchPayslipsPage() {
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [employees, setEmployees] = useState([]);
  const [rows, setRows] = useState([]);
  const [year] = useState("1405");
  const [month, setMonth] = useState("فروردین");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/companies", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || "خطا در دریافت شرکت‌ها");
        setCompanies(result.data || []);
        if (result.data?.length) setCompanyId(String(result.data[0].id));
      } catch (e) { setError(e.message); } finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      setError(""); setPreview(null);
      const response = await fetch(`/api/personnel?company_id=${encodeURIComponent(companyId)}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) { setError(result.error || "خطا در دریافت کارکنان"); return; }
      const list = result.data || [];
      setEmployees(list);
      setRows(list.map(emptyRow));
    })().catch((e) => setError(e.message));
  }, [companyId]);

  const selectedCompany = useMemo(() => companies.find((item) => String(item.id) === String(companyId)), [companies, companyId]);
  const selectedRows = useMemo(() => rows.filter((row) => row.job_group || Number(row.base_salary) > 0), [rows]);
  const totalBase = selectedRows.reduce((sum, row) => {
    const group = Number(row.job_group);
    const daily = PAYROLL_1405_GROUP_WAGE_TABLE[group] || 0;
    return sum + (Number(row.base_salary) > 0 ? Number(row.base_salary) : daily * Math.min(30, Number(row.work_days || 0)));
  }, 0);

  function updateRow(id, field, value) {
    setRows((current) => current.map((row) => Number(row.personnel_id) === Number(id) ? { ...row, [field]: value } : row));
  }

  async function runPreview() {
    if (!companyId || !selectedRows.length) { setError("حداقل یک کارمند با گروه مزدی یا حقوق پایه معتبر انتخاب کنید."); return; }
    setWorking(true); setError("");
    try {
      const response = await fetch("/api/payslips/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company_id: Number(companyId), year: Number(year), month, rows: selectedRows, dry_run: true }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "کنترل نهایی انجام نشد");
      setPreview(result);
    } catch (e) { setError(e.message); } finally { setWorking(false); }
  }

  async function issueBatch() {
    if (!preview || preview.summary.errors > 0 || preview.invalid?.length) return;
    if (!window.confirm(`صدور ${preview.summary.valid} فیش برای ${selectedCompany?.name || "شرکت"} در دوره ${year} / ${month} انجام شود؟`)) return;
    setWorking(true); setError("");
    try {
      const response = await fetch("/api/payslips/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company_id: Number(companyId), year: Number(year), month, rows: selectedRows, dry_run: false }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "صدور گروهی انجام نشد");
      alert(result.message || "صدور گروهی انجام شد.");
      setPreview(null);
    } catch (e) { setError(e.message); } finally { setWorking(false); }
  }

  if (loading) return <main dir="rtl" style={{ padding: 32 }}>در حال آماده‌سازی صدور گروهی...</main>;

  return (
    <main dir="rtl" style={{ maxWidth: 1500, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 20 }}>
        <div><h1 style={{ margin: 0 }}>صدور گروهی فیش حقوقی ۱۴۰۵</h1><p style={{ color: "#64748b" }}>گروه مزدی ۱ تا ۲۰، محاسبه خودکار مزد، سنوات، مزایا، بیمه ۷٪، مالیات پلکانی و خالص پرداختی</p></div>
        <strong style={{ padding: "10px 14px", borderRadius: 12, background: "#eff6ff", color: "#1d4ed8" }}>{selectedCompany?.name || "شرکت انتخاب نشده"}</strong>
      </div>

      {error && <div style={{ padding: 14, marginBottom: 16, borderRadius: 10, background: "#fef2f2", color: "#b91c1c", fontWeight: 600 }}>{error}</div>}

      <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 18, marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
          <label>شرکت<select value={companyId} onChange={(e) => setCompanyId(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }}><option value="">انتخاب...</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label>سال<input value={year} readOnly style={{ width: "100%", padding: 10, marginTop: 6 }} /></label>
          <label>ماه<select value={month} onChange={(e) => setMonth(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }}>{MONTHS.map((m) => <option key={m}>{m}</option>)}</select></label>
          <div style={{ padding: 10, background: "#f8fafc", borderRadius: 10 }}><b>سیستم گروهی</b><div style={{ marginTop: 6, color: "#475569" }}>گروه ۱ تا ۲۰ فعال است؛ حقوق پایه در صورت خالی بودن از گروه پرسنل محاسبه می‌شود.</div></div>
        </div>
      </section>

      <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1250 }}>
          <thead><tr>{["انتخاب/کارمند", "گروه مزدی", "مزد روزانه", "حقوق پایه اختیاری", "کارکرد", "سنوات", "ماموریت روز", "ماموریت ساعت", "اضافه‌کاری", "تأهل", "فرزند", "پاداش", "سایر مزایا", "سایر کسورات"].map((h) => <th key={h} style={{ padding: 10, background: "#f8fafc", textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{h}</th>)}</tr></thead>
          <tbody>{employees.map((employee) => {
            const row = rows.find((item) => Number(item.personnel_id) === Number(employee.id)) || emptyRow(employee);
            const group = Number(row.job_group);
            const dailyWage = PAYROLL_1405_GROUP_WAGE_TABLE[group] || 0;
            const monthlyBase = dailyWage * Math.min(30, Number(row.work_days || 0));
            const active = Boolean(row.job_group || Number(row.base_salary) > 0);
            return <tr key={employee.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: 10, whiteSpace: "nowrap" }}><label><input type="checkbox" checked={active} onChange={(e) => updateRow(employee.id, "job_group", e.target.checked ? (row.job_group || "1") : "")} /> {employee.full_name}<small style={{ display: "block", color: "#64748b" }}>{employee.personnel_code || ""}</small></label></td>
              <td><select value={row.job_group} onChange={(e) => updateRow(employee.id, "job_group", e.target.value)} style={{ width: 90, padding: 7 }}><option value="">—</option>{PAYROLL_1405_GROUP_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td>
              <td style={{ padding: 8, whiteSpace: "nowrap" }}>{dailyWage ? `${money(dailyWage)} ${CURRENCY}` : "—"}<small style={{ display: "block", color: "#64748b" }}>{monthlyBase ? `${money(monthlyBase)} ${CURRENCY}/ماه` : ""}</small></td>
              <td><input value={row.base_salary} placeholder="خودکار" onChange={(e) => updateRow(employee.id, "base_salary", e.target.value)} style={{ width: 110, padding: 7 }} /></td>
              <td><input type="number" min="0" max="31" value={row.work_days} onChange={(e) => updateRow(employee.id, "work_days", e.target.value)} style={{ width: 60, padding: 7 }} /></td>
              <td><input type="checkbox" checked={row.seniority_eligible} onChange={(e) => updateRow(employee.id, "seniority_eligible", e.target.checked)} /></td>
              <td><input type="number" min="0" value={row.mission_days} onChange={(e) => updateRow(employee.id, "mission_days", e.target.value)} style={{ width: 60, padding: 7 }} /></td>
              <td><input type="number" min="0" value={row.mission_hours} onChange={(e) => updateRow(employee.id, "mission_hours", e.target.value)} style={{ width: 60, padding: 7 }} /></td>
              <td><input type="number" min="0" value={row.overtime_hours} onChange={(e) => updateRow(employee.id, "overtime_hours", e.target.value)} style={{ width: 70, padding: 7 }} /></td>
              <td><input type="checkbox" checked={row.married} onChange={(e) => updateRow(employee.id, "married", e.target.checked)} /></td>
              <td><input type="number" min="0" value={row.child_count} onChange={(e) => updateRow(employee.id, "child_count", e.target.value)} style={{ width: 50, padding: 7 }} /></td>
              <td><input value={row.bonus} onChange={(e) => updateRow(employee.id, "bonus", e.target.value)} style={{ width: 80, padding: 7 }} /></td>
              <td><input value={row.other_benefits} onChange={(e) => updateRow(employee.id, "other_benefits", e.target.value)} style={{ width: 80, padding: 7 }} /></td>
              <td><input value={row.other_deductions} onChange={(e) => updateRow(employee.id, "other_deductions", e.target.value)} style={{ width: 80, padding: 7 }} /></td>
            </tr>;
          })}</tbody>
        </table>
      </section>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 18 }}>
        <button onClick={runPreview} disabled={working || !selectedRows.length} style={{ padding: "12px 18px", border: 0, borderRadius: 10, cursor: "pointer", fontWeight: 700 }}>🔎 محاسبه و کنترل نهایی</button>
        <span>کارکنان انتخاب‌شده: <b>{selectedRows.length.toLocaleString("fa-IR")}</b> — جمع پایه تقریبی: <b>{money(totalBase)} {CURRENCY}</b></span>
      </div>

      {preview && <section style={{ marginTop: 20, background: "#f8fafc", borderRadius: 16, padding: 18 }}>
        <h2>نتیجه کنترل نهایی</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
          <div>معتبر<br /><b>{preview.summary.valid.toLocaleString("fa-IR")}</b></div><div>خطا<br /><b>{preview.summary.errors.toLocaleString("fa-IR")}</b></div><div>هشدار<br /><b>{preview.summary.warnings.toLocaleString("fa-IR")}</b></div><div>ناخالص<br /><b>{money(preview.summary.gross)} {CURRENCY}</b></div><div>بیمه<br /><b>{money(preview.summary.insurance)} {CURRENCY}</b></div><div>مالیات<br /><b>{money(preview.summary.tax)} {CURRENCY}</b></div><div>خالص<br /><b>{money(preview.summary.net)} {CURRENCY}</b></div>
        </div>
        {preview.preview?.filter((item) => item.flags.length).map((item) => <div key={item.personnel_id} style={{ marginTop: 10, padding: 10, background: "#fff", borderRadius: 8 }}><b>{item.full_name}</b>: {item.flags.map((flag) => flag.message).join(" | ")}</div>)}
        <button onClick={issueBatch} disabled={working || preview.summary.errors > 0 || preview.invalid?.length > 0} style={{ marginTop: 16, padding: "12px 20px", border: 0, borderRadius: 10, fontWeight: 700 }}>✅ صدور گروهی فیش‌ها</button>
      </section>}
    </main>
  );
}
