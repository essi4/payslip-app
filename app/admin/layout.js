"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  const menuItems = [
    { title: "داشبورد", href: "/admin", icon: "▦" },
    { title: "کارکنان", href: "/admin/employees", icon: "👥" },
    { title: "شرکت‌ها", href: "/admin/companies", icon: "🏢" },
    { title: "دوره‌های حقوق", href: "/admin/payroll-periods", icon: "📅" },
    { title: "فیش‌های حقوقی", href: "/admin/payslips", icon: "📄" },
    { title: "اصلاحات", href: "/admin/corrections", icon: "✏️" },
    { title: "گزارش‌ها", href: "/admin/reports", icon: "📊" },
    { title: "تنظیمات", href: "/admin/settings", icon: "⚙️" },
  ];

  function isActive(item) {
    if (item.href === "/admin") return pathname === "/admin";
    return pathname.startsWith(item.href);
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 text-slate-800">
      <div className="flex min-h-screen">
        <aside className="fixed right-0 top-0 z-40 hidden h-screen w-64 border-l border-slate-700 bg-slate-900 shadow-xl lg:block">
          <div className="flex h-20 items-center border-b border-slate-700 px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl text-white shadow-lg">💼</div>
              <div>
                <div className="text-sm font-extrabold text-white">مدیریت حقوق و دستمزد</div>
                <div className="mt-1 text-[11px] text-slate-400">پنل مدیریت</div>
              </div>
            </div>
          </div>
          <nav className="px-3 py-5">
            <div className="mb-3 px-3 text-[10px] font-bold text-slate-500">منوی اصلی</div>
            <div className="space-y-1.5">
              {menuItems.map((item) => {
                const active = isActive(item);
                return (
                  <Link key={item.href} href={item.href} className={["flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition", active ? "bg-blue-600 text-white shadow-md" : "text-slate-300 hover:bg-slate-800 hover:text-white"].join(" ")}>
                    <span className={["flex h-8 w-8 items-center justify-center rounded-lg text-base", active ? "bg-white/15" : "bg-slate-800"].join(" ")}>{item.icon}</span>
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
          <div className="absolute bottom-0 left-0 right-0 border-t border-slate-700 p-4">
            <div className="rounded-xl bg-slate-800 p-3">
              <div className="text-[11px] font-bold text-slate-400">وضعیت سامانه</div>
              <div className="mt-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-emerald-400">سیستم فعال است</span>
              </div>
            </div>
          </div>
        </aside>

        <div className="w-full lg:hidden">
          <div className="border-b border-slate-700 bg-slate-900 px-4 py-4 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">💼</div>
              <div>
                <div className="text-sm font-extrabold text-white">مدیریت حقوق و دستمزد</div>
                <div className="text-[10px] text-slate-400">پنل مدیریت</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {menuItems.map((item) => {
                const active = isActive(item);
                return <Link key={item.href} href={item.href} className={["flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-bold transition", active ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"].join(" ")}><span>{item.icon}</span><span>{item.title}</span></Link>;
              })}
            </div>
          </div>
          <main>{children}</main>
        </div>

        <div className="hidden min-h-screen w-full lg:block lg:pr-64">
          <main className="min-h-screen">{children}</main>
        </div>
      </div>
    </div>
  );
}
