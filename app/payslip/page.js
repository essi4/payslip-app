"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function Login({ nationalId, setNationalId, password, setPassword, onLogin, onForgot, loading, error }) {
  return (
    <main dir="rtl" className="min-h-screen bg-[#07111f] px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md items-center justify-center">
        <section className="w-full overflow-hidden rounded-[30px] bg-white shadow-2xl">
          <div className="bg-gradient-to-br from-[#07111f] via-[#0b2850] to-[#1464c4] px-6 pb-8 pt-9 text-white">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl ring-1 ring-white/20">💼</div>
            <div className="mt-5 text-center">
              <div className="text-xs font-bold text-blue-200">سامانه کارکنان</div>
              <h1 className="mt-1 text-2xl font-black">سیستم حقوق و دستمزد</h1>
              <p className="mt-2 text-xs text-slate-300">فیش حقوقی و خدمات پرسنلی</p>
            </div>
          </div>
          <div className="p-5 sm:p-7">
            <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-center">
              <div className="text-sm font-black">ورود به حساب کاربری</div>
              <div className="mt-1 text-[10px] font-bold text-slate-500">کد ملی و رمز عبور خود را وارد کنید</div>
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-black">کد ملی</span>
                <input dir="ltr" inputMode="numeric" value={nationalId} onChange={(e) => setNationalId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onLogin()} placeholder="مثلاً 0012345678" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-center text-sm font-black outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-black">رمز عبور</span>
                <input dir="ltr" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onLogin()} placeholder="رمز عبور" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-center text-sm font-black outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100" />
              </label>
              {error && <div className="rounded-2xl bg-red-50 p-3 text-center text-xs font-bold text-red-700">{error}</div>}
              <button onClick={onLogin} disabled={loading} className="w-full rounded-2xl bg-blue-700 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-700/20 disabled:opacity-60">{loading ? "در حال ورود..." : "ورود به پنل پرسنلی ←"}</button>
              <button onClick={onForgot} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-600">فراموشی رمز عبور</button>
            </div>
            <div className="mt-6 text-center text-[10px] font-bold text-slate-400">🔒 اطلاعات حساب شما محرمانه است</div>
          </div>
        </section>
      </div>
    </main>
  );
}

function RecoveryStart({ nationalId, setNationalId, personnelCode, setPersonnelCode, onSubmit, onBack, loading, error }) {
  return (
    <main dir="rtl" className="min-h-screen bg-[#07111f] px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md items-center justify-center">
        <section className="w-full rounded-[30px] bg-white p-5 shadow-2xl sm:p-7">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-center">
            <div className="text-sm font-black">بازیابی رمز عبور</div>
            <div className="mt-1 text-[10px] font-bold text-slate-500">کد ملی و کد پرسنلی را وارد کنید</div>
          </div>
          <div className="mt-5 space-y-3">
            <input dir="ltr" inputMode="numeric" value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="کد ملی" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-center text-sm font-black outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100" />
            <input dir="ltr" inputMode="numeric" value={personnelCode} onChange={(e) => setPersonnelCode(e.target.value)} placeholder="کد پرسنلی" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-center text-sm font-black outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100" />
            {error && <div className="rounded-2xl bg-red-50 p-3 text-center text-xs font-bold text-red-700">{error}</div>}
            <button onClick={onSubmit} disabled={loading} className="w-full rounded-2xl bg-blue-700 px-4 py-3.5 text-sm font-black text-white disabled:opacity-60">{loading ? "در حال بررسی..." : "دریافت کد بازیابی"}</button>
            <button onClick={onBack} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-600">بازگشت به ورود</button>
          </div>
        </section>
      </div>
    </main>
  );
}

function RecoveryVerify({ recoveryCode, setRecoveryCode, newPassword, setNewPassword, confirmPassword, setConfirmPassword, serverRecoveryCode, onSubmit, onBack, loading, error, success }) {
  return (
    <main dir="rtl" className="min-h-screen bg-[#07111f] px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md items-center justify-center">
        <section className="w-full rounded-[30px] bg-white p-5 shadow-2xl sm:p-7">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-center"><div className="text-sm font-black">تغییر رمز عبور</div><div className="mt-1 text-[10px] font-bold text-slate-500">کد بازیابی و رمز جدید را وارد کنید</div></div>
          {serverRecoveryCode && <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-center text-sm font-black text-amber-800">کد بازیابی: {serverRecoveryCode}</div>}
          <div className="mt-4 space-y-3">
            <input dir="ltr" value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)} placeholder="کد بازیابی" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-center text-sm font-black outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100" />
            <input dir="ltr" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="رمز عبور جدید" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-center text-sm font-black outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100" />
            <input dir="ltr" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="تکرار رمز عبور جدید" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-center text-sm font-black outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100" />
            {error && <div className="rounded-2xl bg-red-50 p-3 text-center text-xs font-bold text-red-700">{error}</div>}
            {success && <div className="rounded-2xl bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-700">{success}</div>}
            <button onClick={onSubmit} disabled={loading} className="w-full rounded-2xl bg-blue-700 px-4 py-3.5 text-sm font-black text-white disabled:opacity-60">{loading ? "در حال تغییر..." : "تغییر رمز عبور"}</button>
            <button onClick={onBack} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-600">بازگشت به ورود</button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function PayslipPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [nationalId, setNationalId] = useState("");
  const [password, setPassword] = useState("");
  const [personnelCode, setPersonnelCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [serverRecoveryCode, setServerRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function login() {
    setError("");
    setLoading(true);
    const id = nationalId.replace(/[^0-9]/g, "");
    if (id.length !== 10) { setError("کد ملی باید ۱۰ رقمی باشد."); setLoading(false); return; }
    if (!password.trim()) { setError("رمز عبور را وارد کنید."); setLoading(false); return; }
    try {
      const response = await fetch("/api/payslip", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ national_id: id, password }) });
      const data = await response.json();
      if (!response.ok || !data.success) { setError(data.error || "کد ملی یا رمز عبور اشتباه است."); return; }
      router.replace("/payslip/slips");
    } catch {
      setError("خطا در اتصال به سرور.");
    } finally {
      setLoading(false);
    }
  }

  async function requestRecovery() {
    setError("");
    setSuccess("");
    setLoading(true);
    const id = nationalId.replace(/[^0-9]/g, "");
    if (id.length !== 10) { setError("کد ملی باید ۱۰ رقمی باشد."); setLoading(false); return; }
    if (!personnelCode.trim()) { setError("کد پرسنلی را وارد کنید."); setLoading(false); return; }
    try {
      const response = await fetch("/api/payslip/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ national_id: id, personnel_code: personnelCode.trim() }) });
      const data = await response.json();
      if (!response.ok || !data.success) { setError(data.error || "اطلاعات واردشده صحیح نیست."); return; }
      if (data.recovery_code) setServerRecoveryCode(String(data.recovery_code));
      setSuccess(data.message || "کد بازیابی ایجاد شد.");
      setMode("verify");
    } catch {
      setError("خطا در ارتباط با سرور.");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    setError("");
    setLoading(true);
    if (!recoveryCode.trim() || !newPassword.trim() || newPassword.length < 8 || newPassword !== confirmPassword) {
      setError("رمز جدید باید حداقل ۸ کاراکتر باشد و با تکرار آن یکسان باشد.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/payslip/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ national_id: nationalId.replace(/[^0-9]/g, ""), personnel_code: personnelCode.trim(), recovery_code: recoveryCode.trim(), new_password: newPassword, confirm_password: confirmPassword }) });
      const data = await response.json();
      if (!response.ok || !data.success) { setError(data.error || "تغییر رمز انجام نشد."); return; }
      setSuccess(data.message || "رمز عبور تغییر کرد.");
      setTimeout(() => setMode("login"), 1000);
    } catch {
      setError("خطا در ارتباط با سرور.");
    } finally {
      setLoading(false);
    }
  }

  if (mode === "recovery") return <RecoveryStart nationalId={nationalId} setNationalId={setNationalId} personnelCode={personnelCode} setPersonnelCode={setPersonnelCode} onSubmit={requestRecovery} onBack={() => { setError(""); setMode("login"); }} loading={loading} error={error} />;
  if (mode === "verify") return <RecoveryVerify recoveryCode={recoveryCode} setRecoveryCode={setRecoveryCode} newPassword={newPassword} setNewPassword={setNewPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword} serverRecoveryCode={serverRecoveryCode} onSubmit={resetPassword} onBack={() => { setError(""); setMode("login"); }} loading={loading} error={error} success={success} />;
  return <Login nationalId={nationalId} setNationalId={setNationalId} password={password} setPassword={setPassword} onLogin={login} onForgot={() => { setError(""); setMode("recovery"); }} loading={loading} error={error} />;
}
