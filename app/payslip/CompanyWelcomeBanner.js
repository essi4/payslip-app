"use client";

import { Building2, UserRound } from "lucide-react";

export default function CompanyWelcomeBanner({ employee }) {
  if (!employee) return null;

  return (
    <header
      dir="rtl"
      className="no-print fixed inset-x-3 top-3 z-[60] mx-auto max-w-5xl rounded-[24px] border border-white/60 bg-white/90 px-4 py-3 shadow-[0_16px_45px_-18px_rgba(15,23,42,0.32)] backdrop-blur-xl sm:inset-x-5 sm:top-4 sm:px-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <UserRound size={19} strokeWidth={2.4} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-slate-950 sm:text-base">
              خوش آمدید، {employee.full_name || "کاربر گرامی"}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 sm:text-xs">
              <Building2 size={13} aria-hidden="true" />
              <span className="truncate">شرکت: {employee.company_name || "شرکت"}</span>
            </div>
          </div>
        </div>
        <span className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black text-slate-600 sm:inline-flex">
          پنل کارمند
        </span>
      </div>
    </header>
  );
}
