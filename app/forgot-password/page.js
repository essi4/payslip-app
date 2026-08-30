"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeRequested, setCodeRequested] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function requestReset() {
    setError("");
    setMessage("");
    setCode("");
    setCodeRequested(false);
    setNewPassword("");
    setConfirmPassword("");

    if (!email.trim()) {
      setError("ایمیل را وارد کنید.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/personnel/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "خطا در ارسال کد بازیابی.");
        return;
      }

      setCodeRequested(true);
      setMessage("کد بازیابی به ایمیل ثبت‌شده شما ارسال شد.");
    } catch (error) {
      console.error(error);
      setError("خطا در اتصال به سرور.");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    setError("");
    setMessage("");

    if (!/^\d{6}$/.test(code)) {
      setError("کد بازیابی باید ۶ رقمی باشد.");
      return;
    }

    if (!newPassword) {
      setError("رمز جدید را وارد کنید.");
      return;
    }

    if (newPassword.length < 6) {
      setError("رمز جدید باید حداقل ۶ کاراکتر باشد.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("رمز جدید و تکرار رمز یکسان نیستند.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/personnel/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code,
          newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "خطا در تغییر رمز عبور.");
        return;
      }

      setMessage("رمز عبور با موفقیت تغییر کرد. اکنون می‌توانید وارد شوید.");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setCodeRequested(false);
    } catch (error) {
      console.error(error);
      setError("خطا در اتصال به سرور.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-xl text-white shadow-lg">
            🔐
          </div>
          <h1 className="mt-4 text-xl font-black text-slate-900">بازیابی رمز عبور</h1>
          <p className="mt-2 text-xs leading-6 text-slate-500">
            ایمیل ثبت‌شده خود را وارد کنید تا کد بازیابی رمز برای شما ارسال شود.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {!codeRequested && (
            <>
              <label className="mb-2 block text-xs font-bold text-slate-700">ایمیل پرسنل</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="example@gmail.com"
                dir="ltr"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={requestReset}
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-xs font-black text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "در حال ارسال..." : "دریافت کد بازیابی"}
              </button>
            </>
          )}

          {codeRequested && (
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center text-xs font-bold leading-6 text-blue-800">
                کد ۶ رقمی به ایمیل شما ارسال شد. لطفاً ایمیل و پوشه Spam را بررسی کنید.
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700">کد بازیابی</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                  placeholder="کد ۶ رقمی"
                  dir="ltr"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-lg font-black tracking-[5px] outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700">رمز عبور جدید</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="حداقل ۶ کاراکتر"
                  dir="ltr"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700">تکرار رمز عبور جدید</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="رمز را دوباره وارد کنید"
                  dir="ltr"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <button
                type="button"
                onClick={resetPassword}
                disabled={loading}
                className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? "در حال ذخیره..." : "ذخیره رمز جدید"}
              </button>

              <button
                type="button"
                onClick={requestReset}
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                ارسال دوباره کد
              </button>
            </div>
          )}

          {message && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold leading-6 text-emerald-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold leading-6 text-red-700">
              {error}
            </div>
          )}

          <div className="mt-5 border-t border-slate-100 pt-5 text-center">
            <Link href="/payslip" className="text-[11px] font-bold text-blue-600 hover:text-blue-800">
              بازگشت به صفحه ورود
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
