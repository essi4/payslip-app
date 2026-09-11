"use client";

import { useState } from "react";

export default function EmployeeRecoveryPanel({ employee, companyName, onDone }) {
  const [email, setEmail] = useState(String(employee?.email || ""));
  const [savingEmail, setSavingEmail] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveEmail() {
    setError("");
    setMessage("");
    const normalized = email.trim().toLowerCase();
    if (!normalized) return setError("ایمیل پرسنل را وارد کنید.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return setError("فرمت ایمیل صحیح نیست.");
    try {
      setSavingEmail(true);
      const response = await fetch("/api/personnel/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: employee.id, email: normalized }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) return setError(result.error || "ثبت ایمیل انجام نشد.");
      setEmail(normalized);
      setMessage("ایمیل پرسنل با موفقیت ثبت شد.");
      onDone?.({ ...employee, email: normalized });
    } catch (err) {
      console.error(err);
      setError("خطا در اتصال به سرور.");
    } finally {
      setSavingEmail(false);
    }
  }

  async function sendRecoveryCode() {
    setError("");
    setMessage("");
    const normalized = email.trim().toLowerCase();
    if (!normalized) return setError("ابتدا ایمیل پرسنل را ثبت کنید.");
    try {
      setSendingCode(true);
      const response = await fetch("/api/personnel/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) return setError(result.error || "ارسال کد بازیابی انجام نشد.");
      setMessage("کد بازیابی به ایمیل ثبت‌شده ارسال شد.");
    } catch (err) {
      console.error(err);
      setError("خطا در ارسال کد بازیابی.");
    } finally {
      setSendingCode(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-indigo-50 p-4">
        <div className="font-black text-indigo-900">{employee?.full_name || "پرسنل"}</div>
        <div className="mt-1 text-xs text-indigo-700">{companyName || "شرکت فعال"} · کد {employee?.personnel_code || "—"}</div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-2 text-xs font-black text-slate-700">📧 ایمیل بازیابی</div>
        <p className="mb-3 text-[11px] leading-6 text-slate-500">کد بازیابی فقط به این ایمیل ارسال می‌شود و کد ۱۰ دقیقه اعتبار دارد.</p>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          dir="ltr"
          placeholder="employee@example.com"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
        />
        <button type="button" onClick={saveEmail} disabled={savingEmail} className="mt-3 w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-xs font-black text-indigo-700 disabled:opacity-50">
          {savingEmail ? "در حال ثبت..." : "ذخیره / بروزرسانی ایمیل"}
        </button>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="font-black text-emerald-800">📩 ارسال کد بازیابی</div>
        <p className="mt-1 text-[11px] leading-6 text-emerald-700">از همان موتور امن بازیابی رمز سامانه استفاده می‌شود؛ کد داخل پنل نمایش داده نمی‌شود.</p>
        <button type="button" onClick={sendRecoveryCode} disabled={sendingCode || !email.trim()} className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white disabled:opacity-50">
          {sendingCode ? "در حال ارسال..." : "ارسال کد بازیابی به ایمیل"}
        </button>
      </div>

      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold leading-6 text-emerald-700">{message}</div>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold leading-6 text-rose-700">{error}</div>}
    </div>
  );
}
