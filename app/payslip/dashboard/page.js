"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
        if (!response.ok || !data?.success) {
          router.replace("/payslip");
          return;
        }
        if (active) setEmployee(data.employee || null);
      } catch {
        router.replace("/payslip");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadEmployee();
    return () => { active = false; };
  }, [router]);

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 pb-28 pt-28 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-[26px] bg-white p-5 shadow-sm">
          <div className="text-xs font-bold text-blue-700">پنل پرسنلی</div>
          <h1 className="mt-1 text-2xl font-black">خوش آمدید، {loading ? "..." : employee?.full_name || "کاربر گرامی"}</h1>
          <p className="mt-1 text-xs font-bold text-blue-700">شرکت: {employee?.company_name || "شرکت ثبت نشده"}</p>
        </div>

        <section className="grid gap-3 sm:grid-cols-3">
          {EMPLOYEE_PANEL_CARDS.map((card) => (
            <Link key={card.href} href={card.href} className={`rounded-2xl border ${card.border} bg-white p-4 text-right shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg`}>
              <div className="text-2xl">{card.icon}</div>
              <div className="mt-3 text-sm font-black text-slate-900">{card.title}</div>
              <div className="mt-1 text-[10px] font-bold text-slate-500">{card.subtitle}</div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
