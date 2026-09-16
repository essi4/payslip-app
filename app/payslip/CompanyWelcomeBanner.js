"use client";

export default function CompanyWelcomeBanner({ employee }) {
  if (!employee) return null;

  return (
    <section dir="rtl" className="no-print fixed left-3 right-3 top-3 z-[60] mx-auto max-w-5xl rounded-2xl border border-blue-100 bg-white/95 px-4 py-3 shadow-xl shadow-blue-950/10 backdrop-blur sm:left-5 sm:right-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg">🌹</div>
        <div className="min-w-0">
          <div className="text-sm font-black text-slate-900">خوش آمدید، {employee.full_name}</div>
          <div className="mt-0.5 truncate text-[10px] font-bold text-blue-700">شرکت: {employee.company_name || "شرکت ثبت نشده"}</div>
        </div>
      </div>
    </section>
  );
}
