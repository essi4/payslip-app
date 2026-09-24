"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Users,
  FileText,
  Wallet,
  BarChart3,
  Settings,
  Wrench,
  RefreshCw,
  ArrowLeft,
  Building2,
} from "lucide-react";

function number(value) {
  return Number(value || 0).toLocaleString("fa-IR");
}

function money(value) {
  return `${Number(value || 0).toLocaleString("fa-IR")} تومان`;
}

export default function AdminPage() {
  const [data, setData] = useState({
    companiesCount: 0,
    employeesCount: 0,
    payslipsCount: 0,
    totalBaseSalary: 0,
    totalBenefits: 0,
    totalDeductions: 0,
    totalNetSalary: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboard(refresh = false) {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch("/api/dashboard", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "خطا در دریافت اطلاعات");
      }

      setData({
        companiesCount: result.data?.companiesCount || 0,
        employeesCount: result.data?.employeesCount || 0,
        payslipsCount: result.data?.payslipsCount || 0,
        totalBaseSalary: result.data?.totalBaseSalary || 0,
        totalBenefits: result.data?.totalBenefits || 0,
        totalDeductions: result.data?.totalDeductions || 0,
        totalNetSalary: result.data?.totalNetSalary || 0,
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "خطا در اتصال به سرور");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = [
    {
      title: "شرکت‌ها",
      value: number(data.companiesCount),
      description: "شرکت‌های ثبت‌شده",
      icon: Building2,
      link: "/admin/companies",
    },
    {
      title: "کارکنان",
      value: number(data.employeesCount),
      description: "کارکنان ثبت‌شده",
      icon: Users,
      link: "/admin/employees",
    },
    {
      title: "فیش‌های حقوقی",
      value: number(data.payslipsCount),
      description: "فیش‌های ثبت‌شده",
      icon: FileText,
      link: "/admin/payslips",
    },
    {
      title: "خالص پرداختی",
      value: money(data.totalNetSalary),
      description: "مجموع خالص فیش‌ها",
      icon: Wallet,
      link: "/admin/payslips",
    },
  ];

  const quickLinks = [
    {
      title: "کارکنان",
      description: "ثبت و مدیریت کارکنان",
      icon: Users,
      href: "/admin/employees",
    },
    {
      title: "شرکت‌ها",
      description: "ثبت و مدیریت شرکت‌ها",
      icon: Building2,
      href: "/admin/companies",
    },
    {
      title: "فیش‌های حقوقی",
      description: "ثبت و مدیریت فیش‌ها",
      icon: FileText,
      href: "/admin/payslips",
    },
    {
      title: "اصلاحات",
      description: "بررسی و اصلاح فیش‌ها",
      icon: Wrench,
      href: "/admin/corrections",
    },
  ];

  return (
    <div
      dir="rtl"
      className="min-h-screen space-y-5 bg-slate-100 p-4 sm:p-5 lg:p-6"
    >
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-900 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-300">
                داشبورد مدیریت
              </div>
              <h1 className="mt-1 text-xl font-black text-white sm:text-2xl">
                نمای کلی سامانه
              </h1>
              <p className="mt-1.5 text-xs text-slate-300">
                وضعیت کلی کارکنان، شرکت‌ها و فیش‌های حقوقی
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                سامانه فعال است
              </div>

              <button
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                className="flex items-center gap-2 rounded-xl border border-slate-600 bg-white px-3 py-2 text-xs font-bold text-slate-800 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={refreshing ? "animate-spin" : ""}
                />
                بروزرسانی
              </button>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
          {error}
        </div>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              آمار اصلی
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              چهار شاخصی که در نگاه اول نیاز دارید
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.link}
                className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-slate-500">
                      {item.title}
                    </div>
                    <div className="mt-2 truncate text-lg font-black text-slate-950">
                      {loading ? "..." : item.value}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400">
                      {item.description}
                    </div>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                    <Icon size={19} />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[10px] font-bold text-slate-700">
                  مشاهده
                  <ArrowLeft size={12} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              خلاصه مالی
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              فقط برای یک نگاه سریع؛ جزئیات کامل در گزارش‌هاست.
            </p>
          </div>

          <Link
            href="/admin/reports"
            className="text-[11px] font-black text-slate-700 underline-offset-4 hover:underline"
          >
            مشاهده گزارش‌های مالی
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <div className="text-[10px] font-bold text-slate-500">
              حقوق پایه
            </div>
            <div className="mt-1 text-sm font-black text-slate-900">
              {loading ? "..." : money(data.totalBaseSalary)}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <div className="text-[10px] font-bold text-slate-500">
              مزایا
            </div>
            <div className="mt-1 text-sm font-black text-slate-900">
              {loading ? "..." : money(data.totalBenefits)}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <div className="text-[10px] font-bold text-slate-500">
              کسورات
            </div>
            <div className="mt-1 text-sm font-black text-slate-900">
              {loading ? "..." : money(data.totalDeductions)}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-sm font-black text-slate-900">
            دسترسی سریع
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            چهار کار پرکاربرد پنل
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                    <Icon size={19} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-xs font-black text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
