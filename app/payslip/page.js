"use client";

import { useState } from "react";

function money(value) {
  const number = Number(value || 0);
  return number.toLocaleString("fa-IR") + " تومان";
}

function valueOrDash(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function Cell({ label, value }) {
  return <div className="border-b border-slate-200 bg-white px-3 py-2.5"><div className="mb-1 text-[10px] font-bold text-slate-500">{label}</div><div className="truncate text-xs font-black text-slate-900">{valueOrDash(value)}</div></div>;
}

function MoneyRow({ label, value }) {
  return <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2"><span className="text-xs font-bold text-slate-700">{label}</span><span className="text-xs font-black text-slate-900">{money(value)}</span></div>;
}

function PayslipDocument({ payslip, onBack, onPrint }) {
  const totalBenefits = Number(payslip.housing_allowance || 0) + Number(payslip.food_allowance || 0) + Number(payslip.marriage_allowance || 0) + Number(payslip.child_allowance || 0) + Number(payslip.other_benefits || 0);
  const totalIncome = Number(payslip.base_salary || 0) + Number(payslip.overtime || 0) + Number(payslip.bonus || 0) + totalBenefits;
  const totalDeductions = Number(payslip.insurance || 0) + Number(payslip.tax || 0) + Number(payslip.other_deductions || 0);

  return (
    <article id={"payslip-" + payslip.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
      <div className="bg-gradient-to-l from-slate-950 via-blue-950 to-slate-900 px-4 py-4 text-white md:px-6">
        <div className="grid gap-3 md:grid-cols-3 md:items-center">
          <div className="text-center md:text-right"><div className="text-[10px] text-blue-200">دوره حقوق</div><div className="mt-1 text-sm font-black">{valueOrDash(payslip.month)} {valueOrDash(payslip.year)}</div></div>
          <div className="text-center"><div className="text-lg font-black md:text-xl">سیستم حقوق و دستمزد</div><div className="mt-1 text-[11px] font-bold text-blue-200">فیش حقوق و دستمزد</div></div>
          <div className="text-center md:text-left"><div className="text-[10px] text-blue-200">شماره فیش</div><div className="mt-1 text-sm font-black">{payslip.id ? Number(payslip.id).toLocaleString("fa-IR") : "—"}</div></div>
        </div>
      </div>
      <div className="p-3 md:p-5">
        <section><div className="mb-3 flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-sm">👤</div><div><h2 className="text-sm font-black text-slate-950">مشخصات پرسنل</h2><p className="text-[10px] text-slate-500">اطلاعات شناسایی و شغلی</p></div></div>
          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 md:grid-cols-3">
            <Cell label="نام و نام خانوادگی" value={payslip.full_name}/><Cell label="کد ملی" value={payslip.national_id}/><Cell label="شماره پرسنلی" value={payslip.personnel_code}/><Cell label="عنوان شغلی" value={payslip.job_title || payslip.employee_job_title}/><Cell label="گروه شغلی" value={payslip.job_group}/><Cell label="واحد سازمانی" value={payslip.department}/><Cell label="شماره حساب / شبا" value={payslip.bank_account}/><Cell label="دوره حقوق" value={valueOrDash(payslip.month) + " " + valueOrDash(payslip.year)}/><Cell label="وضعیت" value="رسمی"/>
          </div>
        </section>
        <section className="mt-5"><div className="mb-3 flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-sm">🕐</div><div><h2 className="text-sm font-black text-slate-950">اطلاعات کارکرد</h2><p className="text-[10px] text-slate-500">وضعیت کارکرد دوره حقوق</p></div></div>
          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 md:grid-cols-6"><Cell label="روزهای کارکرد" value="31 روز"/><Cell label="ساعات کارکرد" value="220 ساعت"/><Cell label="اضافه‌کاری" value="—"/><Cell label="مرخصی استحقاقی" value="—"/><Cell label="غیبت" value="0 روز"/><Cell label="ماموریت" value="0 روز"/></div>
        </section>
        <section className="mt-5"><div className="mb-3 flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-sm">💰</div><div><h2 className="text-sm font-black text-slate-950">جزئیات مالی فیش</h2><p className="text-[10px] text-slate-500">مزایا، دریافت‌ها و کسورات</p></div></div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-emerald-200"><div className="bg-emerald-700 px-3 py-2.5 text-center text-xs font-black text-white">مزایا و دریافت‌ها</div><MoneyRow label="حقوق پایه" value={payslip.base_salary}/><MoneyRow label="اضافه‌کاری" value={payslip.overtime}/><MoneyRow label="پاداش" value={payslip.bonus}/><MoneyRow label="حق مسکن" value={payslip.housing_allowance}/><MoneyRow label="بن خواربار" value={payslip.food_allowance}/><MoneyRow label="حق تأهل" value={payslip.marriage_allowance}/><MoneyRow label="حق اولاد" value={payslip.child_allowance}/><MoneyRow label="سایر مزایا" value={payslip.other_benefits}/><div className="flex items-center justify-between bg-emerald-50 px-3 py-2.5"><span className="text-xs font-black text-emerald-800">جمع کل دریافت‌ها</span><span className="text-xs font-black text-emerald-800">{money(totalIncome)}</span></div></div>
            <div className="overflow-hidden rounded-xl border border-red-200"><div className="bg-red-700 px-3 py-2.5 text-center text-xs font-black text-white">کسورات قانونی</div><MoneyRow label="بیمه تأمین اجتماعی" value={payslip.insurance}/><MoneyRow label="مالیات بر درآمد" value={payslip.tax}/><MoneyRow label="سایر کسورات" value={payslip.other_deductions}/><div className="min-h-[232px] bg-white"/><div className="flex items-center justify-between bg-red-50 px-3 py-2.5"><span className="text-xs font-black text-red-800">جمع کل کسورات</span><span className="text-xs font-black text-red-800">{money(totalDeductions)}</span></div></div>
          </div>
        </section>
        <section className="mt-5 overflow-hidden rounded-2xl bg-gradient-to-l from-blue-950 to-slate-900 p-4 text-white shadow-lg"><div className="grid gap-3 md:grid-cols-2 md:items-center"><div className="text-center md:text-right"><div className="text-xs font-bold text-blue-200">مبلغ نهایی قابل پرداخت به کارمند</div><div className="mt-1 text-[10px] text-slate-300">خالص حقوق پس از کسر کسورات قانونی</div></div><div className="text-center"><div className="text-xs font-bold text-blue-200">خالص پرداختی</div><div className="mt-1 text-2xl font-black md:text-3xl">{money(payslip.net_salary)}</div></div></div></section>
        <div className="mt-7 grid gap-6 text-center md:grid-cols-2"><div><div className="text-xs font-black text-slate-700">امضاء دریافت‌کننده / کارمند</div><div className="mt-8 text-xs text-slate-400">..............................</div></div><div><div className="text-xs font-black text-slate-700">مهر و امضاء مدیر امور مالی</div><div className="mt-8 text-xs text-slate-400">..............................</div></div></div>
        <div className="mt-6 border-t border-slate-200 pt-4 text-center text-[10px] text-slate-500">این فیش به صورت الکترونیکی صادر شده است.</div>
        <div className="no-print mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center"><button type="button" onClick={onBack} className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-100">← بازگشت به ماه‌ها</button><button type="button" onClick={() => onPrint(payslip.id)} className="rounded-xl bg-blue-700 px-6 py-2 text-xs font-black text-white shadow transition hover:bg-blue-800">🖨 چاپ همین فیش</button></div>
      </div>
    </article>
  );
}

export default function PayslipPage() {
  const [mode, setMode] = useState("login");
  const [nationalId, setNationalId] = useState("");
  const [password, setPassword] = useState("");
  const [personnelCode, setPersonnelCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [serverRecoveryCode, setServerRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [employee, setEmployee] = useState(null);
  const [months, setMonths] = useState([]);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function login() {
    setError(""); setSuccess(""); setLoading(true); setEmployee(null); setMonths([]); setSelectedPayslip(null);
    const cleanId = nationalId.replace(/[^0-9]/g, "");
    if (cleanId.length !== 10) { setError("کد ملی باید ۱۰ رقمی باشد."); setLoading(false); return; }
    if (!password.trim()) { setError("رمز عبور را وارد کنید."); setLoading(false); return; }
    try {
      const response = await fetch("/api/payslip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ national_id: cleanId, password }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) { setError(result.error || "کد ملی یا رمز عبور اشتباه است."); return; }
      setEmployee(result.employee); setMonths(result.months || []);
      if (!result.months || result.months.length === 0) setError("برای این پرسنل هنوز فیشی ثبت نشده است.");
    } catch (error) { console.error(error); setError("خطا در اتصال به سرور."); } finally { setLoading(false); }
  }

  async function requestRecovery() {
    setError(""); setSuccess(""); setServerRecoveryCode(""); setLoading(true);
    const cleanId = nationalId.replace(/[^0-9]/g, ""); const cleanPersonnelCode = personnelCode.trim();
    if (cleanId.length !== 10) { setError("کد ملی باید ۱۰ رقمی باشد."); setLoading(false); return; }
    if (!cleanPersonnelCode) { setError("کد پرسنلی را وارد کنید."); setLoading(false); return; }
    try {
      const response = await fetch("/api/payslip/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ national_id: cleanId, personnel_code: cleanPersonnelCode }) });
      const result = await response.json();
      if (!response.ok || !result.success) { setError(result.error || "اطلاعات واردشده صحیح نیست."); return; }
      if (result.recovery_code) setServerRecoveryCode(String(result.recovery_code));
      setSuccess(result.message || "کد بازیابی ایجاد شد."); setMode("verify");
    } catch (error) { console.error(error); setError("خطا در ارتباط با سرور."); } finally { setLoading(false); }
  }

  async function resetPassword() {
    setError(""); setSuccess(""); setLoading(true);
    if (!recoveryCode.trim()) { setError("کد بازیابی را وارد کنید."); setLoading(false); return; }
    if (!newPassword.trim()) { setError("رمز عبور جدید را وارد کنید."); setLoading(false); return; }
    if (newPassword.length < 4) { setError("رمز عبور جدید باید حداقل ۴ کاراکتر باشد."); setLoading(false); return; }
    if (newPassword !== confirmPassword) { setError("رمز عبور جدید و تکرار آن یکسان نیست."); setLoading(false); return; }
    try {
      const response = await fetch("/api/payslip/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ national_id: nationalId.replace(/[^0-9]/g, ""), personnel_code: personnelCode.trim(), recovery_code: recoveryCode.trim(), new_password: newPassword }) });
      const result = await response.json();
      if (!response.ok || !result.success) { setError(result.error || "تغییر رمز عبور انجام نشد."); return; }
      setSuccess(result.message || "رمز عبور با موفقیت تغییر کرد."); setPassword(""); setRecoveryCode(""); setNewPassword(""); setConfirmPassword(""); setServerRecoveryCode("");
      setTimeout(() => { setMode("login"); setSuccess(""); }, 1500);
    } catch (error) { console.error(error); setError("خطا در تغییر رمز عبور."); } finally { setLoading(false); }
  }

  async function openPayslip(month, year) {
    if (!employee) return;
    setLoading(true); setError(""); setSelectedPayslip(null);
    try {
      const response = await fetch("/api/payslip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          national_id: employee.national_id,
          password,
          month,
          year,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) { setError(result.error || "دریافت فیش انجام نشد."); return; }
      setSelectedPayslip(result.data?.[0] || null);
    } catch (error) { console.error(error); setError("خطا در دریافت فیش."); } finally { setLoading(false); }
  }

  function printPayslip(id) {
    const printWindow = window.open("", "_blank", "width=900,height=1200");
    if (!printWindow) return;
    const source = document.getElementById("payslip-" + id);
    if (!source) { printWindow.close(); return; }
    printWindow.document.write("<html><head><title>فیش حقوقی</title><style>body{font-family:Tahoma,Arial,sans-serif;direction:rtl;padding:20px}button,.no-print{display:none!important}</style></head><body>" + source.outerHTML + "</body></html>");
    printWindow.document.close(); printWindow.focus(); setTimeout(() => printWindow.print(), 300);
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-5xl">
        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
        {success && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{success}</div>}
        {!employee && mode === "login" && (
          <section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <h1 className="text-xl font-black">ورود به سامانه فیش حقوقی</h1>
            <div className="mt-5 space-y-3"><input value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="کد ملی" className="w-full rounded-xl border p-3" inputMode="numeric"/><input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="رمز عبور" type="password" className="w-full rounded-xl border p-3"/></div>
            <button onClick={login} disabled={loading} className="mt-4 w-full rounded-xl bg-blue-700 p-3 font-black text-white disabled:opacity-50">{loading ? "در حال ورود..." : "ورود"}</button>
            <button onClick={() => { setError(""); setSuccess(""); setMode("forgot"); }} className="mt-3 w-full text-sm font-bold text-blue-700">فراموشی رمز عبور</button>
          </section>
        )}
        {!employee && mode === "forgot" && (
          <section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <h1 className="text-xl font-black">بازیابی رمز عبور</h1>
            <div className="mt-5 space-y-3"><input value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="کد ملی" className="w-full rounded-xl border p-3" inputMode="numeric"/><input value={personnelCode} onChange={(e) => setPersonnelCode(e.target.value)} placeholder="کد پرسنلی" className="w-full rounded-xl border p-3"/></div>
            <button onClick={requestRecovery} disabled={loading} className="mt-4 w-full rounded-xl bg-blue-700 p-3 font-black text-white disabled:opacity-50">{loading ? "در حال ارسال..." : "ارسال کد بازیابی"}</button>
            <button onClick={() => { setError(""); setMode("login"); }} className="mt-3 w-full text-sm font-bold text-slate-600">بازگشت به ورود</button>
          </section>
        )}
        {!employee && mode === "verify" && (
          <section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <h1 className="text-xl font-black">تغییر رمز عبور</h1>
            <div className="mt-5 space-y-3"><input value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)} placeholder="کد بازیابی ۶ رقمی" className="w-full rounded-xl border p-3" inputMode="numeric"/><input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="رمز عبور جدید" type="password" className="w-full rounded-xl border p-3"/><input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="تکرار رمز عبور جدید" type="password" className="w-full rounded-xl border p-3"/></div>
            <button onClick={resetPassword} disabled={loading} className="mt-4 w-full rounded-xl bg-emerald-700 p-3 font-black text-white disabled:opacity-50">{loading ? "در حال تغییر..." : "تغییر رمز"}</button>
            <button onClick={() => { setError(""); setMode("login"); }} className="mt-3 w-full text-sm font-bold text-slate-600">بازگشت به ورود</button>
          </section>
        )}
        {employee && !selectedPayslip && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-xl font-black">سلام {employee.full_name}</h1><p className="mt-1 text-sm text-slate-500">فیش‌های حقوقی شما</p></div><button onClick={() => { setEmployee(null); setMonths([]); setPassword(""); setMode("login"); }} className="rounded-xl border px-4 py-2 text-sm font-bold">خروج</button></div><div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3">{months.map((item) => <button key={item.id} onClick={() => openPayslip(item.month, item.year)} className="rounded-xl border bg-slate-50 p-4 text-right transition hover:bg-blue-50"><div className="text-sm font-black">{item.month} {item.year}</div><div className="mt-2 text-sm font-bold">{money(item.net_salary)}</div><div className="mt-1 text-[10px] text-slate-500">{item.created_at ? new Date(item.created_at).toLocaleDateString("fa-IR") : ""}</div></button>)}</div></section>
        )}
        {employee && selectedPayslip && <PayslipDocument payslip={selectedPayslip} onBack={() => setSelectedPayslip(null)} onPrint={printPayslip}/>} 
      </div>
    </main>
  );
}
