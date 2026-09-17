"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const cards = [
  {
    href: "/payslip/slips",
    icon: "📄",
    title: "فیش حقوقی",
    subtitle: "مشاهده آخرین فیش حقوقی خود",
    status: "فعال ✓",
    statusClass: "bg-emerald-100 text-emerald-700",
    cardClass: "bg-white border-slate-200",
    iconClass: "bg-blue-50 text-blue-700",
  },
  {
    href: "/payslip/order",
    icon: "📋",
    title: "آخرین حکم کارگزینی",
    subtitle: "مشاهده آخرین حکم و مشخصات شغلی",
    status: "امضا شده ✓",
    statusClass: "bg-emerald-900 text-white",
    cardClass: "bg-emerald-50 border-emerald-100",
    iconClass: "bg-white text-emerald-700",
  },
];

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

  if (loading) {
    return (
      <main dir="rtl" className="min-h-screen bg-slate-50 px-4 pb-28 pt-10 sm:px-6">
        <div className="mx-auto max-w-5xl animate-pulse rounded-[28px] bg-white p-6 shadow-sm">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="mt-3 h-8 w-64 rounded bg-slate-200" />
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 pb-28 pt-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <section className="mb-7">
          <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">
            خوش آمدید، {employee?.full_name || "کاربر گرامی"}
          </h1>
          <p className="mt-2 text-sm font-bold text-slate-500">
            کد پرسنلی: {employee?.personnel_code || "ثبت نشده"}
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-black text-slate-900">دسترسی سریع</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {cards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className={`relative min-h-[190px] rounded-[24px] border p-5 text-right shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${card.cardClass}`}
              >
                <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-black ${card.statusClass}`}>
                  {card.status}
                </span>
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-sm ${card.iconClass}`}>
                  {card.icon}
                </div>
                <h3 className="mt-5 text-base font-black text-slate-950">{card.title}</h3>
                <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{card.subtitle}</p>
                <span className="mt-5 block text-xs font-black text-blue-700">برای مشاهده کلیک کنید</span>
              </Link>
            ))}

            <Link
              href="/payslip/account"
              className="relative min-h-[190px] rounded-[24px] border border-emerald-100 bg-emerald-50 p-5 text-right shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="absolute left-4 top-4 rounded-full bg-emerald-900 px-3 py-1 text-[10px] font-black text-white">
                تایید شده ✓
              </span>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl text-emerald-700 shadow-sm">📱</div>
              <h3 className="mt-5 text-base font-black text-slate-950">شماره موبایل</h3>
              <p dir="ltr" className="mt-2 text-right text-lg font-black tracking-wide text-slate-900">
                {employee?.mobile || "ثبت نشده"}
              </p>
              <p className="mt-1 text-[10px] font-bold leading-5 text-slate-500">
                شماره موبایل شما تایید شده و به نام شماست
              </p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
