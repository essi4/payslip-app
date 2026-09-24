"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, CalendarDays, ChevronLeft, ClipboardList, FileText, UserRound } from "lucide-react";
import { getPayslipYears, getAvailablePayslipMonths } from "../../lib/payslip-selection";

function toman(value) {
  return Math.round(Number(value || 0) / 10).toLocaleString("fa-IR") + " تومان";
}

function formatLabel(value) {
  return String(value ?? "").trim() || "—";
}

function DashboardCard({ href, Icon, title, description, badge, children }) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-[220px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 text-right shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_45px_-22px_rgba(15,23,42,0.3)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <Icon size={22} strokeWidth={2.2} aria-hidden="true" />
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[9px] font-black text-slate-500">{badge}</span>
      </div>

      <h2 className="mt-5 text-lg font-black text-slate-950">{title}</h2>
      <p className="mt-1.5 text-xs font-bold leading-5 text-slate-500">{description}</p>

      <div className="mt-auto pt-5">
        {children}
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-black text-blue-700">
          مشاهده
          <ChevronLeft size={15} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

export default function EmployeePanelDashboard() {
  const router = useRouter();
  const [employee, setEmployee] = useState(null);
  const [months, setMonths] = useState([]);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [payslipLoading, setPayslipLoading] = useState(false);
  const [error, setError] = useState("");

  const years = useMemo(() => getPayslipYears(months), [months]);
  const availableMonths = useMemo(
    () => getAvailablePayslipMonths(months, selectedYear),
    [months, selectedYear],
  );

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
        if (!active) return;

        setEmployee(data.employee || null);

        const list = Array.isArray(data.months) ? [...data.months] : [];
        setMonths(list);

        const firstYear = getPayslipYears(list)[0] || "";
        const firstMonth = getAvailablePayslipMonths(list, firstYear)[0]?.month || "";
        setSelectedYear(firstYear);
        setSelectedMonth(String(firstMonth || ""));
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

  useEffect(() => {
    if (!selectedYear) return;

    if (!availableMonths.some((item) => String(item.month) === String(selectedMonth))) {
      setSelectedMonth(String(availableMonths[0]?.month || ""));
    }
  }, [availableMonths, selectedMonth, selectedYear]);

  useEffect(() => {
    if (!selectedYear || !selectedMonth) return;

    let active = true;

    async function loadPayslip() {
      setPayslipLoading(true);
      setError("");

      try {
        const response = await fetch("/api/payslip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ year: selectedYear, month: selectedMonth }),
        });
        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error(data?.error || "فیش این ماه پیدا نشد.");
        }
        if (active) setSelectedPayslip(data.data?.[0] || null);
      } catch (err) {
        if (active) {
          setSelectedPayslip(null);
          setError(err.message || "خطا در دریافت فیش.");
        }
      } finally {
        if (active) setPayslipLoading(false);
      }
    }

    loadPayslip();

    return () => {
      active = false;
    };
  }, [selectedYear, selectedMonth]);

  if (loading) {
    return (
      <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl animate-pulse">
          <div className="h-28 rounded-[30px] bg-white shadow-sm" />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="h-56 rounded-[28px] bg-white" />
            <div className="h-56 rounded-[28px] bg-white" />
            <div className="h-56 rounded-[28px] bg-white" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <section className="mb-5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[10px] font-black text-blue-700">
            <BriefcaseBusiness size={14} aria-hidden="true" />
            پنل کارمند
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">داشبورد کارمند</h1>
          <p className="text-xs font-bold text-slate-500">دسترسی سریع به فیش حقوقی، حکم کارگزینی و حساب شما</p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <DashboardCard
            href="/payslip/slips"
            Icon={FileText}
            title="فیش‌های حقوقی من"
            description="انتخاب سال و ماه و مشاهده جزئیات کامل فیش حقوقی."
            badge="حقوق و مزایا"
          >
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="block" onClick={(event) => event.preventDefault()}>
                  <span className="mb-1 block text-[9px] font-black text-slate-500">سال</span>
                  <select
                    value={selectedYear}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => setSelectedYear(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[10px] font-black text-slate-800 outline-none focus:border-blue-500"
                  >
                    {years.length ? years.map((year) => <option key={year} value={year}>{year}</option>) : <option value="">—</option>}
                  </select>
                </label>

                <label className="block" onClick={(event) => event.preventDefault()}>
                  <span className="mb-1 block text-[9px] font-black text-slate-500">ماه</span>
                  <select
                    value={selectedMonth}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[10px] font-black text-slate-800 outline-none focus:border-blue-500"
                  >
                    {availableMonths.length ? availableMonths.map((item) => <option key={String(item.year) + "-" + String(item.month) + "-" + (item.id || "payslip")} value={item.month}>{item.month}</option>) : <option value="">—</option>}
                  </select>
                </label>
              </div>

              <div className="mt-3 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[9px] font-bold text-slate-400">خالص پرداختی</div>
                  <div className="mt-0.5 truncate text-lg font-black text-slate-950">
                    {payslipLoading ? "در حال دریافت..." : selectedPayslip ? toman(selectedPayslip.net_salary) : "—"}
                  </div>
                </div>
                <CalendarDays size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
              </div>
            </div>
          </DashboardCard>

          <DashboardCard
            href="/payslip/order"
            Icon={ClipboardList}
            title="حکم کارگزینی"
            description="مشاهده آخرین حکم و مشخصات شغلی ثبت‌شده در پرونده شما."
            badge="پرونده شغلی"
          >
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-[9px] font-bold text-slate-400">شماره آخرین حکم</div>
              <div className="mt-1 text-sm font-black text-slate-900">{formatLabel(employee?.last_order_number || employee?.order_number)}</div>
              <div className="mt-2 text-[10px] font-bold text-slate-500">دسترسی امن به سند ثبت‌شده توسط مدیریت</div>
            </div>
          </DashboardCard>

          <DashboardCard
            href="/payslip/account"
            Icon={UserRound}
            title="حساب من"
            description="اطلاعات حساب و تنظیمات امنیتی را مدیریت کنید."
            badge="حساب کاربری"
          >
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-[9px] font-bold text-slate-400">کد پرسنلی</div>
              <div className="mt-1 text-sm font-black text-slate-900">{formatLabel(employee?.personnel_code)}</div>
              <div className="mt-2 text-[10px] font-bold text-slate-500">{employee?.mobile ? "شماره موبایل ثبت شده است." : "شماره موبایل ثبت نشده است."}</div>
            </div>
          </DashboardCard>
        </section>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-center text-xs font-bold text-rose-700">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
