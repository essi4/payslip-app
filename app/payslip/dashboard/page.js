"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EMPLOYEE_PANEL_CARDS } from "../../lib/employee-panel";

export default function EmployeePanelDashboard() {
  const router = useRouter();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadEmployee() {
      try {
        const response = await fetch("/api/payslip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({}),
        });
        const data = await response.json();

        if (!response.ok || !data?.success || !data?.employee) {
          router.replace("/payslip");
          return;
        }

        if (active) setEmployee(data.employee);
      } catch {
        router.replace("/payslip");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEmployee();
    return () => {
      active = false;
    };
  }, [router]);

  if (loading) {
    return (
      <main dir="rtl" className="min-h-screen bg-slate-50 px-4 pb-12 pt-10 sm:px-6">
        <div className="mx-auto max-w-5xl animate-pulse rounded-[28px] bg-white p-6 shadow-sm">
          <div className="h-5 w-28 rounded bg-slate-200" />
          <div className="mt-3 h-8 w-64 rounded bg-slate-200" />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-44 rounded-[26px] bg-slate-200" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 pb-12 pt-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <section className="mb-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="text-xs font-bold text-blue-700">پنل پرسنلی</div>
          <h1 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
            خوش آمدید، {employee?.full_name || "کاربر گرامی"}
          </h1>
          <p className="mt-2 text-sm font-bold text-slate-500">
            شرکت: {employee?.company_name || "ثبت نشده"}
          </p>
        </section>

        <section aria-label="خدمات پرسنلی" className="grid gap-4 md:grid-cols-3">
          {EMPLOYEE_PANEL_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group min-h-[190px] rounded-[26px] border border-slate-200 bg-white p-5 text-right shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-2xl shadow-sm ring-1 ring-black/5">
                {card.icon}
              </div>
              <h2 className="mt-6 text-lg font-black text-slate-950">
                {card.title}
              </h2>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
                {card.subtitle}
              </p>
              <span className="mt-6 block text-xs font-black text-blue-700">
                مشاهده ←
              </span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
