"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function EmployeeBottomNav() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/payslip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({}),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active) setAuthenticated(Boolean(data?.success && data?.employee));
      })
      .catch(() => {
        if (active) setAuthenticated(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!authenticated) return null;

  return (
    <nav dir="rtl" className="no-print fixed bottom-3 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-2xl shadow-slate-950/15 backdrop-blur md:bottom-5 md:gap-2">
      <Link href="/payslip" className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-[11px] font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 md:px-4" aria-label="فیش‌های حقوقی من">
        <span aria-hidden="true">📄</span>
        فیش‌های حقوقی من
      </Link>
      <Link href="/payslip/order" className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-3 py-2.5 text-[11px] font-black text-white shadow-md shadow-blue-700/20 transition hover:bg-blue-800 active:scale-95 md:px-4" aria-label="حکم کارگزینی">
        <span aria-hidden="true">📝</span>
        حکم کارگزینی
      </Link>
      <Link href="/payslip/account" className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-[11px] font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 md:px-4" aria-label="حساب من">
        <span aria-hidden="true">👤</span>
        حساب من
      </Link>
    </nav>
  );
}
