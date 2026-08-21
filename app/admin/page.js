"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Users,
  FileText,
  Wallet,
  Receipt,
  BarChart3,
  Settings,
  Wrench,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

function number(value) {
  return Number(value || 0).toLocaleString("fa-IR");
}

function money(value) {
  return `${Number(value || 0).toLocaleString("fa-IR")} تومان`;
}

export default function AdminPage() {
  const [data, setData] = useState({
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
        throw new Error(
          result.error || "خطا در دریافت اطلاعات"
        );
      }

      setData({
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

  const cards = [
    {
      title: "تعداد کارکنان",
      value: number(data.employeesCount),
      description: "کارکنان ثبت شده",
      icon: Users,
      box: "bg-blue-50",
      iconColor: "text-blue-700",
      link: "/admin/employees",
    },
    {
      title: "فیش‌های حقوقی",
      value: number(data.payslipsCount),
      description: "فیش ثبت شده",
      icon: FileText,
      box: "bg-emerald-50",
      iconColor: "text-emerald-700",
      link: "/admin/payslips",
    },
    {
      title: "خالص پرداختی",
      value: money(data.totalNetSalary),
      description: "مجموع خالص فیش‌ها",
      icon: Wallet,
      box: "bg-purple-50",
      iconColor: "text-purple-700",
      link: "/admin/payslips",
    },
    {
      title: "وضعیت سیستم",
      value: "آنلاین",
      description: "اتصال به سیستم برقرار است",
      icon: ShieldCheck,
      box: "bg-cyan-50",
      iconColor: "text-cyan-700",
      link: null,
    },
  ];

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 p-3 sm:p-5"
    >
      {/* HEADER */}

      <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-l from-slate-950 via-blue-950 to-blue-700 p-6 text-white shadow-xl">
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-blue-400/10" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <BarChart3 size={21} />
              </div>

              <span className="text-xs font-bold text-blue-200">
                داشبورد مدیریتی
              </span>
            </div>

            <h1 className="text-2xl font-black">
              پنل مدیریت چابکان
            </h1>

            <p className="mt-2 text-xs text-slate-300">
              مدیریت کارکنان و فیش‌های حقوقی
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-xs font-bold">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              سامانه فعال است
            </div>

            <button
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-xs font-bold hover:bg-white/20 disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={
                  refreshing ? "animate-spin" : ""
                }
              />

              بروزرسانی
            </button>
          </div>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700">
          {error}
        </div>
      )}

      {/* TITLE */}

      <div className="mb-4">
        <h2 className="text-lg font-black text-slate-900">
          وضعیت سامانه
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          خلاصه اطلاعات سیستم حقوق و دستمزد
        </p>
      </div>

      {/* CARDS */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          const content = (
            <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500">
                    {card.title}
                  </div>

                  <div className="mt-2 truncate text-2xl font-black text-slate-950">
                    {loading ? "..." : card.value}
                  </div>

                  <div className="mt-2 text-[10px] text-slate-400">
                    {card.description}
                  </div>
                </div>

                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${card.box} ${card.iconColor}`}
                >
                  <Icon size={22} />
                </div>
              </div>

              {card.link && (
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] font-black text-blue-700">
                  مشاهده و مدیریت
                  <ArrowLeft size={13} />
                </div>
              )}
            </div>
          );

          return card.link ? (
            <Link key={card.title} href={card.link}>
              {content}
            </Link>
          ) : (
            <div key={card.title}>{content}</div>
          );
        })}
      </div>

      {/* FINANCIAL */}

      <div className="mb-4">
        <h2 className="text-lg font-black text-slate-900">
          خلاصه مالی
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          مجموع مبالغ ثبت شده در فیش‌ها
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <TrendingUp size={20} />
            </div>

            <div>
              <div className="text-xs font-bold text-blue-700">
                حقوق پایه
              </div>

              <div className="mt-1 text-base font-black text-slate-900">
                {loading
                  ? "..."
                  : money(data.totalBaseSalary)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Wallet size={20} />
            </div>

            <div>
              <div className="text-xs font-bold text-emerald-700">
                مزایا
              </div>

              <div className="mt-1 text-base font-black text-slate-900">
                {loading
                  ? "..."
                  : money(data.totalBenefits)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-700">
              <Receipt size={20} />
            </div>

            <div>
              <div className="text-xs font-bold text-red-700">
                کسورات
              </div>

              <div className="mt-1 text-base font-black text-slate-900">
                {loading
                  ? "..."
                  : money(data.totalDeductions)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACCESS */}

      <div className="mb-4">
        <h2 className="text-lg font-black text-slate-900">
          مدیریت سامانه
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          دسترسی سریع به بخش‌های اصلی
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Link
          href="/admin/employees"
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
        >
          <Users className="text-blue-700" size={24} />

          <h3 className="mt-4 text-sm font-black text-slate-900">
            کارکنان
          </h3>

          <p className="mt-2 text-[11px] leading-5 text-slate-500">
            ثبت و مدیریت کارکنان
          </p>
        </Link>

        <Link
          href="/admin/payslips"
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
        >
          <FileText className="text-emerald-700" size={24} />

          <h3 className="mt-4 text-sm font-black text-slate-900">
            فیش‌های حقوقی
          </h3>

          <p className="mt-2 text-[11px] leading-5 text-slate-500">
            ثبت و مدیریت فیش‌ها
          </p>
        </Link>

        <Link
          href="/admin/corrections"
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
        >
          <Wrench className="text-orange-700" size={24} />

          <h3 className="mt-4 text-sm font-black text-slate-900">
            اصلاح فیش‌ها
          </h3>

          <p className="mt-2 text-[11px] leading-5 text-slate-500">
            بررسی و اصلاح فیش‌ها
          </p>
        </Link>

        <Link
          href="/admin/reports"
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:-translate-y-1 hover:border-purple-200 hover:shadow-lg"
        >
          <BarChart3 className="text-purple-700" size={24} />

          <h3 className="mt-4 text-sm font-black text-slate-900">
            گزارش‌ها
          </h3>

          <p className="mt-2 text-[11px] leading-5 text-slate-500">
            گزارش‌های سیستم
          </p>
        </Link>

        <Link
          href="/admin/settings"
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
        >
          <Settings className="text-slate-700" size={24} />

          <h3 className="mt-4 text-sm font-black text-slate-900">
            تنظیمات
          </h3>

          <p className="mt-2 text-[11px] leading-5 text-slate-500">
            تنظیمات سامانه
          </p>
        </Link>
      </div>

      {/* FOOTER */}

      <div className="border-t border-slate-200 pt-6 text-center">
        <div className="text-[10px] font-black text-slate-400">
          سیستم حقوق و دستمزد چابکان
        </div>

        <div className="mt-1 text-[9px] text-slate-400">
          مدیریت امن اطلاعات کارکنان و فیش‌های حقوقی
        </div>
      </div>
    </div>
  );
}