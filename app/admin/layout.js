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

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-100 text-slate-800"
    >
      {/* ================= MOBILE OVERLAY ================= */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="بستن منو"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`
          fixed right-0 top-0 z-50 flex h-screen w-[280px]
          flex-col overflow-hidden
          bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950
          text-white shadow-2xl
          transition-transform duration-300
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center justify-between">
            <Link
              href="/admin"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-950/50">
                <Building2 size={25} />
              </div>

              <div>
                <div className="text-base font-extrabold">
                  سیستم حقوق و دستمزد
                </div>

                <div className="mt-1 text-xs text-slate-400">
                  پنل مدیریت
                </div>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            >
              <X size={21} />
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="mx-4 mt-5 rounded-2xl border border-emerald-400/10 bg-emerald-500/10 p-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="block h-3 w-3 rounded-full bg-emerald-400" />
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-50" />
            </div>

            <div>
              <div className="text-sm font-bold">
                سامانه فعال است
              </div>

              <div className="mt-0.5 text-xs text-slate-400">
                اتصال به سیستم برقرار است
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 flex-1 overflow-y-auto px-4 pb-4">
          <div className="mb-3 px-3 text-[11px] font-bold text-slate-500">
            منوی اصلی
          </div>

          <div className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group relative flex items-center gap-3 rounded-2xl
                    px-4 py-3.5 text-sm font-semibold
                    transition-all duration-200
                    ${
                      active
                        ? "bg-gradient-to-l from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-950/30"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }
                  `}
                >
                  {active && (
                    <span className="absolute right-0 top-2 h-8 w-1 rounded-l-full bg-white" />
                  )}

                  <span
                    className={`
                      flex h-9 w-9 items-center justify-center rounded-xl
                      ${
                        active
                          ? "bg-white/15"
                          : "bg-white/5 group-hover:bg-white/10"
                      }
                    `}
                  >
                    <Icon size={19} />
                  </span>

                  <span className="flex-1">{item.title}</span>

                  {active && (
                    <ChevronLeft
                      size={17}
                      className="text-white/80"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-300 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10">
              <LogOut size={18} />
            </span>

            <span>
              {loggingOut ? "در حال خروج..." : "خروج از سامانه"}
            </span>
          </button>

          <div className="mt-3 text-center text-[10px] text-slate-600">
            سیستم حقوق و دستمزد
          </div>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <div className="min-h-screen lg:mr-[280px]">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
          <div className="flex h-[76px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              {/* Mobile menu */}
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-blue-50 hover:text-blue-600 lg:hidden"
              >
                <Menu size={22} />
              </button>

              <div>
                <div className="text-lg font-extrabold text-slate-900">
                  پنل مدیریت
                </div>

                <div className="hidden text-xs text-slate-500 sm:block">
                  مدیریت سیستم حقوق و دستمزد
                </div>
              </div>
            </div>

            {/* Admin Profile */}
            <div className="flex items-center gap-3">
              <div className="hidden text-left sm:block">
                <div className="text-sm font-bold text-slate-800">
                  مدیر سامانه
                </div>

                <div className="text-xs text-slate-500">
                  مدیر سیستم
                </div>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-sm font-bold text-white shadow-lg shadow-blue-200">
                ا
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-76px)] p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}