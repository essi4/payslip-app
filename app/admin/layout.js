"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Wrench,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  ChevronLeft,
} from "lucide-react";
import { useState } from "react";

const menuItems = [
  {
    title: "داشبورد",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "کارکنان",
    href: "/admin/employees",
    icon: Users,
  },
  {
    title: "فیش‌های حقوقی",
    href: "/admin/payslips",
    icon: FileText,
  },
  {
    title: "اصلاح فیش‌ها",
    href: "/admin/corrections",
    icon: Wrench,
  },
  {
    title: "گزارش‌ها",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    title: "تنظیمات",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await fetch("/api/auth/logout", {
        method: "POST",
      });

      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/admin/login");
    } finally {
      setLoggingOut(false);
    }
  }

  function isActive(href) {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-100 text-slate-800"
    >

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="بستن منو"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed right-0 top-0 z-50 flex h-screen w-[250px]
          flex-col overflow-hidden
          bg-slate-950 text-white
          shadow-xl
          transition-transform duration-300
          lg:translate-x-0
          ${sidebarOpen
            ? "translate-x-0"
            : "translate-x-full"}
        `}
      >

        {/* BRAND */}
        <div className="border-b border-white/10 px-4 py-4">

          <div className="flex items-center justify-between">

            <Link
              href="/admin"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3"
            >

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                <Building2 size={21} />
              </div>

              <div>
                <div className="text-sm font-black">
                  سیستم حقوق و دستمزد
                </div>

                <div className="mt-0.5 text-[10px] text-slate-400">
                  پنل مدیریت
                </div>
              </div>

            </Link>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            >
              <X size={19} />
            </button>

          </div>
        </div>

        {/* STATUS */}
        <div className="mx-3 mt-4 rounded-xl border border-emerald-400/10 bg-emerald-500/10 px-3 py-2.5">

          <div className="flex items-center gap-2.5">

            <div className="relative">
              <span className="block h-2.5 w-2.5 rounded-full bg-emerald-400" />

              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-40" />
            </div>

            <div>
              <div className="text-xs font-bold">
                سامانه فعال است
              </div>

              <div className="mt-0.5 text-[10px] text-slate-400">
                اتصال برقرار است
              </div>
            </div>

          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="mt-5 flex-1 overflow-y-auto px-3">

          <div className="mb-2 px-2 text-[10px] font-bold text-slate-500">
            منوی اصلی
          </div>

          <div className="space-y-1">

            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group relative flex items-center gap-2.5
                    rounded-xl px-3 py-3
                    text-xs font-bold
                    transition
                    ${
                      active
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }
                  `}
                >

                  {active && (
                    <span className="absolute right-0 top-2 h-7 w-1 rounded-l-full bg-white" />
                  )}

                  <span
                    className={`
                      flex h-8 w-8 items-center justify-center rounded-lg
                      ${
                        active
                          ? "bg-white/10"
                          : "bg-white/5"
                      }
                    `}
                  >
                    <Icon size={17} />
                  </span>

                  <span className="flex-1">
                    {item.title}
                  </span>

                  {active && (
                    <ChevronLeft
                      size={15}
                      className="text-white/70"
                    />
                  )}

                </Link>
              );
            })}

          </div>
        </nav>

        {/* LOGOUT */}
        <div className="border-t border-white/10 p-3">

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-xs font-bold text-slate-300 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
          >

            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
              <LogOut size={17} />
            </span>

            <span>
              {loggingOut
                ? "در حال خروج..."
                : "خروج از سامانه"}
            </span>

          </button>

          <div className="mt-2 text-center text-[9px] text-slate-600">
            سیستم حقوق و دستمزد
          </div>

        </div>

      </aside>

      {/* MAIN */}
      <div className="min-h-screen lg:mr-[250px]">

        {/* HEADER */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">

          <div className="flex h-[64px] items-center justify-between px-4 sm:px-6">

            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600 lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div>
                <div className="text-sm font-black text-slate-900">
                  پنل مدیریت
                </div>

                <div className="hidden text-[10px] text-slate-500 sm:block">
                  مدیریت سیستم حقوق و دستمزد
                </div>
              </div>

            </div>

            {/* ADMIN */}
            <div className="flex items-center gap-2.5">

              <div className="hidden text-left sm:block">
                <div className="text-xs font-bold text-slate-800">
                  مدیر سامانه
                </div>

                <div className="text-[10px] text-slate-500">
                  مدیر سیستم
                </div>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-xs font-bold text-white shadow-sm">
                ا
              </div>

            </div>

          </div>
        </header>

        {/* CONTENT */}
        <main className="min-h-[calc(100vh-64px)] p-4 sm:p-5 lg:p-6">

          <div className="mx-auto w-full max-w-[1500px]">
            {children}
          </div>

        </main>

      </div>

    </div>
  );
}