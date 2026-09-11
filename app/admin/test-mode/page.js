"use client";

import { useEffect, useState } from "react";

const STEP_LABELS = {
  setup: "ساخت محیط تست",
  bulk_issue: "صدور گروهی",
  duplicate_guard: "کنترل فیش تکراری",
  final_print_validation: "کنترل نهایی چاپ",
  cleanup: "پاک‌سازی خودکار",
};

export default function TestModePage() {
  const [enabled, setEnabled] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function loadStatus() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/test-mode", { cache: "no-store" });
      const data = await response.json();
      setEnabled(Boolean(data.enabled));
    } catch {
      setError("وضعیت TEST MODE دریافت نشد.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function runTest() {
    setRunning(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch("/api/admin/test-mode", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      setResult(data);
      if (!data.success) setError(data.message || data.error || "تست با خطا متوقف شد.");
    } catch {
      setError("ارتباط با موتور TEST MODE برقرار نشد.");
    } finally {
      setRunning(false);
      loadStatus();
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-extrabold text-blue-300">
                🧪 TEST MODE
              </div>
              <h1 className="text-2xl font-black sm:text-3xl">تست واقعی زنجیره حقوق و دستمزد</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
                این موتور فقط رکوردهای موقت خودش را می‌سازد، صدور گروهی و کنترل نهایی چاپ را از طریق APIهای واقعی اجرا می‌کند و در پایان همه رکوردهای ساخته‌شده را حذف می‌کند.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm">
              <div className="text-slate-400">وضعیت</div>
              <div className={`mt-1 font-black ${enabled ? "text-emerald-400" : "text-amber-300"}`}>
                {loading ? "در حال بررسی…" : enabled ? "فعال و آماده اجرا" : "غیرفعال"}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-5">
          {[
            ["1", "ساخت", "شرکت + ۲ کارمند + ۱ دوره"],
            ["2", "صدور", "۲ فیش واقعی با API گروهی"],
            ["3", "ضد تکرار", "صدور مجدد = ۰ فیش جدید"],
            ["4", "چاپ", "اعتبارسنجی ۲ فیش برای یک دوره"],
            ["5", "پاک‌سازی", "حذف کامل رکوردهای تست"],
          ].map(([number, title, detail]) => (
            <div key={number} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-blue-700">{number}</div>
              <div className="mt-3 font-black text-slate-900">{title}</div>
              <div className="mt-1 text-xs leading-6 text-slate-500">{detail}</div>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-6">
          <div className="font-black text-amber-900">🔒 محافظ‌های ایمنی</div>
          <ul className="mt-3 space-y-2 text-sm leading-7 text-amber-900/80">
            <li>• فقط مدیر واردشده می‌تواند موتور را اجرا کند.</li>
            <li>• اجرای موتور بدون <code className="rounded bg-amber-100 px-1.5 py-0.5 font-bold">PAYROLL_TEST_MODE=true</code> با وضعیت 403 متوقف می‌شود.</li>
            <li>• شناسه‌های دقیق شرکت، کارمند، دوره و فیش‌های ساخته‌شده ثبت می‌شوند و پاک‌سازی فقط روی همان شناسه‌ها انجام می‌شود.</li>
            <li>• اگر هر مرحله شکست بخورد، پاک‌سازی در مسیر خطا هم اجرا می‌شود.</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">اجرای تست قابل تکرار</h2>
              <p className="mt-1 text-sm text-slate-500">هیچ اطلاعات واقعی برای اجرای این سناریو انتخاب نمی‌شود.</p>
            </div>
            <button
              type="button"
              onClick={runTest}
              disabled={!enabled || running || loading}
              className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {running ? "در حال اجرای تست…" : "🧪 اجرای TEST MODE"}
            </button>
          </div>

          {!enabled && !loading && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
              TEST MODE عمداً در این محیط خاموش است. پس از تنظیم متغیر محیطی <code className="rounded bg-slate-200 px-1.5 py-0.5 font-bold">PAYROLL_TEST_MODE=true</code> و دیپلوی مجدد، دکمه اجرا فعال می‌شود.
            </div>
          )}

          {error && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold leading-7 text-red-700">🔴 {error}</div>}

          {result?.steps?.length > 0 && (
            <div className="mt-6 space-y-3">
              {result.steps.map((item, index) => (
                <div key={`${item.step}-${index}`} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${item.status === "passed" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {item.status === "passed" ? "✓" : "!"}
                  </div>
                  <div>
                    <div className="font-black text-slate-900">{STEP_LABELS[item.step] || item.step}</div>
                    <div className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {result?.success && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <div className="text-2xl">🟢</div>
              <div className="mt-2 text-lg font-black text-emerald-800">TEST MODE سبز شد</div>
              <div className="mt-1 text-sm text-emerald-700">زنجیره کامل اجرا شد و داده‌های تستی به صفر برگشتند.</div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
