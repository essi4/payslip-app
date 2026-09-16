"use client";

import Link from "next/link";

export default function EmployeeDashboardHome({ employee, payslipCount = 0 }) {
  const cards = [
    { href: "/payslip/slips", icon: "📄", title: "فیش حقوقی", text: `${payslipCount.toLocaleString("fa-IR")} فیش ثبت شده · مشاهده و چاپ`, tone: "blue" },
    { href: "/payslip/order", icon: "📋", title: "حکم کارگزینی", text: "مشاهده اطلاعات حکم و مشخصات شغلی", tone: "violet" },
    { href: "/payslip/account", icon: "👤", title: "مشخصات من", text: "اطلاعات هویتی، شغلی و سازمانی", tone: "emerald" },
  ];

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 pb-28 pt-28 sm:px-6 sm:pt-32">
      <div className="mx-auto max-w-5xl">
        <section className="mb-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="text-xs font-bold text-blue-700">پنل پرسنلی</div>
          <h1 className="mt-1 text-2xl font-black text-slate-950">خدمات و اطلاعات شغلی شما</h1>
          {employee?.full_name && <p className="mt-2 text-xs font-bold text-slate-500">برای {employee.full_name}</p>}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <Link key={card.href} href={card.href} className={`group min-h-[180px] rounded-[26px] border p-5 text-right shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl ${card.tone === "blue" ? "border-blue-100 bg-gradient-to-br from-blue-50 to-white" : card.tone === "violet" ? "border-violet-100 bg-gradient-to-br from-violet-50 to-white" : "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white"}`}>
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-black/5">{card.icon}</div>
                <span className="rounded-full bg-white/80 px-3 py-1 text-[9px] font-black text-slate-600">مشاهده ←</span>
              </div>
              <div className="mt-6 text-lg font-black text-slate-950">{card.title}</div>
              <div className="mt-1 text-[10px] font-bold leading-5 text-slate-500">{card.text}</div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
