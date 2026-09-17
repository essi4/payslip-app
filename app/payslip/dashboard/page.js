"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildPayslipBreakdown } from "../../lib/payslip-breakdown";

const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

function rial(value) {
  return `${Number(value || 0).toLocaleString("fa-IR")} ریال`;
}

function toman(value) {
  return `${Math.round(Number(value || 0) / 10).toLocaleString("fa-IR")} تومان`;
}

function monthOrder(value) {
  const n = Number(value);
  if (Number.isFinite(n) && n >= 1 && n <= 12) return n;
  return MONTHS.indexOf(String(value || "").trim()) + 1;
}

function formatLabel(value) {
  return String(value || "").trim() || "—";
}

const cards = [
  {
    icon: "📋",
    title: "آخرین حکم کارگزینی",
    subtitle: "مشاهده آخرین حکم و مشخصات شغلی",
    status: "امضا شده ✓",
    statusClass: "bg-emerald-900 text-white",
    cardClass: "bg-emerald-50 border-emerald-100",
    iconClass: "bg-white text-emerald-700",
    href: "/payslip/order",
  },
];

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

  const years = useMemo(() => {
    return [...new Set(months.map((item) => String(item.year || "")).filter(Boolean))].sort((a, b) => Number(b) - Number(a));
  }, [months]);

  const availableMonths = useMemo(() => {
    return months
      .filter((item) => String(item.year) === String(selectedYear))
      .sort((a, b) => monthOrder(a.month) - monthOrder(b.month));
  }, [months, selectedYear]);

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
        list.sort((a, b) => Number(b.year || 0) - Number(a.year || 0) || monthOrder(b.month) - monthOrder(a.month));
        setMonths(list);
        if (list.length) {
          setSelectedYear(String(list[0].year || ""));
          setSelectedMonth(String(list[0].month || ""));
        }
      } catch {
        router.replace("/payslip");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadEmployee();
    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    if (!selectedYear || !availableMonths.length) return;
    if (!availableMonths.some((item) => String(item.month) === String(selectedMonth))) {
      setSelectedMonth(String(availableMonths[0].month || ""));
    }
  }, [availableMonths, selectedMonth, selectedYear]);

  async function loadSelectedPayslip(year = selectedYear, month = selectedMonth) {
    if (!year || !month) return;
    setPayslipLoading(true);
    setError("");
    try {
      const response = await fetch("/api/payslip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ year, month }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) throw new Error(data?.error || "فیش این ماه پیدا نشد.");
      setSelectedPayslip(data.data?.[0] || null);
    } catch (err) {
      setSelectedPayslip(null);
      setError(err.message || "خطا در دریافت فیش.");
    } finally {
      setPayslipLoading(false);
    }
  }

  useEffect(() => {
    if (selectedYear && selectedMonth) loadSelectedPayslip(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

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

  const breakdown = selectedPayslip ? buildPayslipBreakdown(selectedPayslip) : null;

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 pb-28 pt-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <section className="mb-7">
          <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">خوش آمدید، {employee?.full_name || "کاربر گرامی"}</h1>
          <p className="mt-2 text-sm font-bold text-slate-500">کد پرسنلی: {employee?.personnel_code || "ثبت نشده"}</p>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-black text-slate-900">دسترسی سریع</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <section className="relative rounded-[24px] border border-slate-200 bg-white p-5 text-right shadow-sm md:col-span-1">
              <span className="absolute left-4 top-4 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-700">فعال ✓</span>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-700 shadow-sm">📄</div>
              <h3 className="mt-5 text-base font-black text-slate-950">فیش حقوقی</h3>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-500">سال و ماه فیش را انتخاب کنید و جزئیات کامل پرداختی و کسورات را ببینید.</p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-[10px] font-black text-slate-500">سال فیش</span>
                  <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-800 outline-none focus:border-blue-500">
                    {years.length ? years.map((year) => <option key={year} value={year}>{year}</option>) : <option value="">—</option>}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-black text-slate-500">ماه فیش</span>
                  <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-800 outline-none focus:border-blue-500">
                    {availableMonths.length ? availableMonths.map((item) => <option key={`${item.year}-${item.month}`} value={item.month}>{item.month}</option>) : <option value="">—</option>}
                  </select>
                </label>
              </div>

              {error && <div className="mt-3 rounded-xl bg-red-50 p-2 text-[10px] font-bold text-red-700">{error}</div>}

              {payslipLoading ? (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-center text-xs font-black text-slate-500">در حال دریافت فیش...</div>
              ) : selectedPayslip ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="border-b border-slate-200 bg-slate-950 px-4 py-3 text-white">
                    <div className="text-[10px] font-bold text-blue-200">فیش {formatLabel(selectedPayslip.month)} {formatLabel(selectedPayslip.year)}</div>
                    <div className="mt-1 text-lg font-black">{toman(selectedPayslip.net_salary)}</div>
                    <div className="text-[9px] font-bold text-slate-300">خالص پرداختی</div>
                  </div>

                  <div className="grid gap-2 p-3 sm:grid-cols-2">
                    {[
                      ["نام و نام خانوادگی", selectedPayslip.full_name],
                      ["کد پرسنلی", selectedPayslip.personnel_code],
                      ["عنوان شغلی", selectedPayslip.job_title || selectedPayslip.employee_job_title],
                      ["گروه مزدی", selectedPayslip.job_group],
                      ["روزهای کارکرد", selectedPayslip.work_days],
                      ["شماره حساب", selectedPayslip.bank_account],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-slate-200 bg-white p-2">
                        <div className="text-[8px] font-bold text-slate-400">{label}</div>
                        <div className="mt-1 truncate text-[10px] font-black text-slate-800">{formatLabel(value)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-3 p-3">
                    <div className="overflow-hidden rounded-xl border border-emerald-100 bg-white">
                      <div className="flex items-center justify-between bg-emerald-50 px-3 py-2">
                        <span className="text-[10px] font-black text-emerald-900">پرداختی‌ها و مزایا</span>
                        <span className="text-[9px] font-black text-emerald-700">{toman(breakdown.totalPayments)}</span>
                      </div>
                      {breakdown.payments.map((item) => (
                        <div key={item.key} className="flex items-center justify-between border-t border-slate-100 px-3 py-2">
                          <span className="text-[9px] font-bold text-slate-600">{item.label}</span>
                          <span className="text-[9px] font-black text-slate-900">{toman(item.amount)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="overflow-hidden rounded-xl border border-red-100 bg-white">
                      <div className="flex items-center justify-between bg-red-50 px-3 py-2">
                        <span className="text-[10px] font-black text-red-900">کسورات</span>
                        <span className="text-[9px] font-black text-red-700">{toman(breakdown.totalDeductions)}</span>
                      </div>
                      {breakdown.deductions.map((item) => (
                        <div key={item.key} className="flex items-center justify-between border-t border-slate-100 px-3 py-2">
                          <span className="text-[9px] font-bold text-slate-600">{item.label}</span>
                          <span className="text-[9px] font-black text-red-700">{toman(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mx-3 mb-3 rounded-xl bg-blue-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-blue-950">خالص پرداختی</span>
                      <span className="text-sm font-black text-blue-900">{toman(selectedPayslip.net_salary)}</span>
                    </div>
                    <div className="mt-1 text-left text-[8px] font-bold text-slate-500">{rial(selectedPayslip.net_salary)}</div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-center text-[10px] font-bold text-slate-500">برای این ماه فیشی ثبت نشده است.</div>
              )}

              <Link href="/payslip/slips" className="mt-4 block text-center text-xs font-black text-blue-700">مشاهده همه فیش‌ها ←</Link>
            </section>

            {cards.map((card) => (
              <Link key={card.href} href={card.href} className={`relative min-h-[190px] rounded-[24px] border p-5 text-right shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${card.cardClass}`}>
                <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-black ${card.statusClass}`}>{card.status}</span>
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-sm ${card.iconClass}`}>{card.icon}</div>
                <h3 className="mt-5 text-base font-black text-slate-950">{card.title}</h3>
                <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{card.subtitle}</p>
                <span className="mt-5 block text-xs font-black text-blue-700">برای مشاهده کلیک کنید</span>
              </Link>
            ))}

            <Link href="/payslip/account" className="relative min-h-[190px] rounded-[24px] border border-emerald-100 bg-emerald-50 p-5 text-right shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <span className="absolute left-4 top-4 rounded-full bg-emerald-900 px-3 py-1 text-[10px] font-black text-white">تایید شده ✓</span>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl text-emerald-700 shadow-sm">📱</div>
              <h3 className="mt-5 text-base font-black text-slate-950">شماره موبایل</h3>
              <p dir="ltr" className="mt-2 text-right text-lg font-black tracking-wide text-slate-900">{employee?.mobile || "ثبت نشده"}</p>
              <p className="mt-1 text-[10px] font-bold leading-5 text-slate-500">شماره موبایل شما تایید شده و به نام شماست</p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
