"use client";

import { useEffect, useState } from "react";

export default function EmployeeAccountPage() {
  const [employee, setEmployee] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/payslip", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({}) });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || "نشست معتبر نیست.");
        setEmployee(result.employee);
      } catch (err) {
        setError(err.message || "نشست شما معتبر نیست.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function changePassword() {
    setError(""); setSuccess(""); setSaving(true);
    try {
      const response = await fetch("/api/payslip/change-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword, confirm_password: confirmPassword })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "تغییر رمز عبور انجام نشد.");
      setSuccess(result.message);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setTimeout(() => { window.location.href = "/payslip"; }, 1200);
    } catch (err) {
      setError(err.message || "تغییر رمز عبور انجام نشد.");
    } finally { setSaving(false); }
  }

  async function logout() {
    await fetch("/api/payslip/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/payslip";
  }

  if (loading) return <main dir="rtl" className="min-h-screen bg-slate-100 p-4"><div className="mx-auto mt-12 max-w-lg rounded-2xl bg-white p-8 text-center font-black text-slate-700 shadow">در حال بررسی حساب...</div></main>;
  if (!employee) return <main dir="rtl" className="min-h-screen bg-slate-100 p-4"><div className="mx-auto mt-12 max-w-lg rounded-2xl border border-red-100 bg-white p-8 text-center shadow"><div className="text-3xl">🔒</div><h1 className="mt-3 text-lg font-black text-slate-900">دسترسی به حساب</h1><p className="mt-2 text-sm font-bold text-red-600">{error || "نشست شما معتبر نیست."}</p><a href="/payslip" className="mt-5 inline-flex rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-black text-white">بازگشت به ورود</a></div></main>;

  return <main dir="rtl" className="min-h-screen bg-slate-100 px-3 py-5 md:px-5"><div className="mx-auto max-w-2xl"><header className="mb-4 rounded-2xl bg-gradient-to-l from-slate-950 via-blue-950 to-slate-900 p-5 text-white shadow-lg"><div className="text-[10px] font-bold text-blue-300">سیستم حقوق و دستمزد</div><h1 className="mt-1 text-xl font-black">👤 حساب من</h1><p className="mt-1 text-xs text-slate-300">مدیریت اطلاعات امنیتی حساب کارکنان</p></header>
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-3 text-sm font-black text-slate-900">اطلاعات حساب</div><div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 md:grid-cols-3"><div className="border-b border-slate-200 p-3"><div className="text-[10px] font-bold text-slate-500">نام و نام خانوادگی</div><div className="mt-1 text-sm font-black text-slate-900">{employee.full_name}</div></div><div className="border-b border-slate-200 p-3"><div className="text-[10px] font-bold text-slate-500">کد پرسنلی</div><div className="mt-1 text-sm font-black text-slate-900">{employee.personnel_code || "—"}</div></div><div className="border-b border-slate-200 p-3"><div className="text-[10px] font-bold text-slate-500">واحد</div><div className="mt-1 text-sm font-black text-slate-900">{employee.department || "—"}</div></div></div></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-1 flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">🔐</div><div><h2 className="text-base font-black text-slate-950">امنیت حساب</h2><p className="text-[10px] font-bold text-slate-500">برای تغییر رمز، رمز فعلی را وارد کنید.</p></div></div><div className="mt-5 space-y-3"><input type="password" autoComplete="current-password" value={currentPassword} onChange={e=>{setCurrentPassword(e.target.value);setError("")}} placeholder="رمز عبور فعلی" className="w-full rounded-xl border border-slate-300 px-3 py-3 text-center text-sm font-black outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"/><input type="password" autoComplete="new-password" value={newPassword} onChange={e=>{setNewPassword(e.target.value);setError("")}} placeholder="رمز عبور جدید — حداقل ۸ کاراکتر" className="w-full rounded-xl border border-slate-300 px-3 py-3 text-center text-sm font-black outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"/><input type="password" autoComplete="new-password" value={confirmPassword} onChange={e=>{setConfirmPassword(e.target.value);setError("")}} onKeyDown={e=>{if(e.key === "Enter") changePassword()}} placeholder="تکرار رمز عبور جدید" className="w-full rounded-xl border border-slate-300 px-3 py-3 text-center text-sm font-black outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"/>{error && <div className="rounded-xl bg-red-50 px-3 py-2.5 text-center text-xs font-bold text-red-700">{error}</div>}{success && <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-center text-xs font-bold text-emerald-700">{success}</div>}<button type="button" disabled={saving} onClick={changePassword} className="w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-black text-white shadow transition hover:bg-blue-800 disabled:opacity-50">{saving ? "در حال تغییر رمز..." : "🔑 تغییر رمز عبور"}</button></div></section>
    <div className="mt-4 grid gap-2 sm:grid-cols-2"><a href="/payslip" className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-xs font-black text-slate-700 hover:bg-slate-50">← بازگشت به فیش‌ها</a><button type="button" onClick={logout} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black text-red-700 hover:bg-red-100">🚪 خروج امن</button></div>
    <footer className="py-6 text-center text-[10px] text-slate-500">© سیستم حقوق و دستمزد</footer></div></main>;
}
