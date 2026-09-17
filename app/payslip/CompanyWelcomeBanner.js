"use client";

export default function CompanyWelcomeBanner({ employee }) {
  if (!employee) return null;

  return (
    <header dir="rtl" className="no-print fixed left-3 right-3 top-3 z-[60] mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl shadow-blue-950/10 backdrop-blur sm:left-5 sm:right-5">
      <div className="text-center text-xs font-black text-slate-900 sm:text-sm">
        سامانه پرسنلی {employee.company_name || "شرکت"}
      </div>
      <div className="mt-1 text-center text-[10px] font-bold text-slate-500">
        {employee.full_name} - {employee.national_id || "کد ملی ثبت نشده"}
      </div>
    </header>
  );
}
