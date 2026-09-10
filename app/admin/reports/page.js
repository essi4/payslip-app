"use client";

import { useEffect, useState } from "react";

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [error, setError] = useState("");

  const months = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
  ];

  useEffect(() => {
    async function loadCompanies() {
      try {
        setCompaniesLoading(true);
        const response = await fetch("/api/companies", { cache: "no-store" });
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "خطا در دریافت شرکت‌ها");
        }

        const list = Array.isArray(result.data) ? result.data : [];
        setCompanies(list);

        if (list.length > 0) {
          setCompanyId(String(list[0].id));
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "خطا در دریافت شرکت‌ها");
      } finally {
        setCompaniesLoading(false);
      }
    }

    loadCompanies();
  }, []);

  async function loadReports() {
    if (!companyId) {
      setReport(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("company_id", companyId);
      if (year) params.set("year", year);
      if (month) params.set("month", month);

      const response = await fetch(`/api/reports?${params.toString()}`, {
        cache: "no-store",
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "خطا در دریافت گزارش");
      }

      setReport(result.data);
    } catch (err) {
      console.error(err);
      setReport(null);
      setError(err.message || "خطا در اتصال به سرور");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!companiesLoading) loadReports();
  }, [companyId, year, month, companiesLoading]);

  function formatMoney(value) {
    return Number(value || 0).toLocaleString("fa-IR");
  }

  function printReport() {
    window.print();
  }

  function resetFilters() {
    setYear("");
    setMonth("");
  }

  const selectedCompany = companies.find(
    (company) => String(company.id) === String(companyId)
  );

  if (companiesLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 text-center" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-10 shadow">
          <div className="text-5xl">📊</div>
          <h2 className="mt-4 text-xl font-bold">در حال آماده‌سازی گزارش...</h2>
          <p className="mt-2 text-gray-500">ابتدا شرکت و سپس اطلاعات حقوق و دستمزد دریافت می‌شود.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 text-center" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-10 shadow">
          <div className="text-5xl">⚠️</div>
          <h2 className="mt-4 text-xl font-bold">دریافت گزارش ناموفق بود</h2>
          <p className="mt-3 text-red-600">{error}</p>
          <button
            onClick={loadReports}
            className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  if (!companyId || !selectedCompany) {
    return (
      <div className="min-h-screen bg-gray-100 p-6" dir="rtl">
        <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 text-center shadow">
          <div className="text-5xl">🏢</div>
          <h1 className="mt-4 text-2xl font-bold">انتخاب شرکت</h1>
          <p className="mt-2 text-gray-500">برای مشاهده گزارش حقوق و دستمزد، ابتدا یک شرکت انتخاب کنید.</p>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="mx-auto mt-6 w-full max-w-md rounded-lg border p-3"
          >
            <option value="">انتخاب شرکت</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  const summary = report?.summary || {};
  const payslips = report?.payslips || [];
  const monthly = report?.monthlyReports || report?.monthly || [];

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6" dir="rtl">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">📊 گزارش حقوق و دستمزد</h1>
            <p className="mt-2 text-gray-500">گزارش‌ها فقط مربوط به شرکت انتخاب‌شده هستند.</p>
          </div>
          <button onClick={printReport} className="rounded-lg bg-gray-800 px-6 py-3 text-white hover:bg-gray-900">
            🖨 چاپ گزارش
          </button>
        </div>

        <div className="mb-6 rounded-2xl border border-blue-100 bg-white p-5 shadow">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm text-gray-500">شرکت فعال در گزارش</div>
              <div className="mt-1 text-xl font-bold text-blue-700">🏢 {selectedCompany.name}</div>
            </div>
            <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">
              تمام اعداد و فیش‌های این صفحه مخصوص همین شرکت است.
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block font-medium">شرکت</label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full rounded-lg border p-3"
              >
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block font-medium">سال</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="مثلاً 1405"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">ماه</label>
              <select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full rounded-lg border p-3">
                <option value="">همه ماه‌ها</option>
                {months.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </div>

          <button onClick={resetFilters} className="mt-4 rounded-lg bg-gray-500 px-5 py-3 text-white hover:bg-gray-600">
            پاک کردن فیلتر سال و ماه
          </button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow"><p className="text-gray-500">👥 کارکنان شرکت</p><h2 className="mt-2 text-3xl font-bold text-blue-600">{formatMoney(report?.employeesCount)}</h2></div>
          <div className="rounded-xl bg-white p-6 shadow"><p className="text-gray-500">📄 تعداد فیش‌ها</p><h2 className="mt-2 text-3xl font-bold text-green-600">{formatMoney(report?.payslipsCount)}</h2></div>
          <div className="rounded-xl bg-white p-6 shadow"><p className="text-gray-500">💰 مجموع حقوق پایه</p><h2 className="mt-2 text-2xl font-bold text-indigo-600">{formatMoney(report?.totalBaseSalary)}</h2><span className="text-gray-500">تومان</span></div>
          <div className="rounded-xl bg-white p-6 shadow"><p className="text-gray-500">🎁 مجموع مزایا</p><h2 className="mt-2 text-2xl font-bold text-emerald-600">{formatMoney(report?.totalBenefits)}</h2><span className="text-gray-500">تومان</span></div>
          <div className="rounded-xl bg-white p-6 shadow"><p className="text-gray-500">➖ مجموع کسورات</p><h2 className="mt-2 text-2xl font-bold text-red-600">{formatMoney(report?.totalDeductions)}</h2><span className="text-gray-500">تومان</span></div>
          <div className="rounded-xl bg-white p-6 shadow"><p className="text-gray-500">💵 مجموع خالص پرداختی</p><h2 className="mt-2 text-2xl font-bold text-purple-600">{formatMoney(report?.totalNetSalary)}</h2><span className="text-gray-500">تومان</span></div>
        </div>

        <div className="mb-8 overflow-hidden rounded-xl bg-white shadow">
          <div className="border-b p-6">
            <h2 className="text-xl font-bold">📅 گزارش دوره‌ای — {selectedCompany.name}</h2>
            <p className="mt-1 text-gray-500">خلاصه حقوق و پرداختی فقط برای این شرکت</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-100"><tr><th className="p-4">سال</th><th className="p-4">ماه</th><th className="p-4">تعداد فیش</th><th className="p-4">حقوق پایه</th><th className="p-4">مزایا</th><th className="p-4">کسورات</th><th className="p-4">خالص پرداختی</th></tr></thead>
              <tbody>
                {monthly.length === 0 ? (
                  <tr><td colSpan="7" className="p-8 text-center text-gray-500">اطلاعاتی برای این شرکت و فیلتر انتخاب‌شده وجود ندارد.</td></tr>
                ) : monthly.map((item, index) => (
                  <tr key={`${item.year}-${item.month}-${index}`} className="border-t">
                    <td className="p-4">{item.year}</td>
                    <td className="p-4 font-medium">{item.month}</td>
                    <td className="p-4">{formatMoney(item.payslipsCount ?? item.payslips_count)}</td>
                    <td className="p-4">{formatMoney(item.baseSalary ?? item.base_salary)} تومان</td>
                    <td className="p-4 text-green-600">{formatMoney(item.benefits)} تومان</td>
                    <td className="p-4 text-red-600">{formatMoney(item.deductions)} تومان</td>
                    <td className="p-4 font-bold text-purple-600">{formatMoney(item.netSalary ?? item.net_salary)} تومان</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow">
          <div className="border-b p-6">
            <h2 className="text-xl font-bold">📄 جزئیات فیش‌ها — {selectedCompany.name}</h2>
            <p className="mt-1 text-gray-500">هیچ فیشی از شرکت‌های دیگر در این جدول نمایش داده نمی‌شود.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-100"><tr><th className="p-4">#</th><th className="p-4">کارمند</th><th className="p-4">کد پرسنلی</th><th className="p-4">دوره</th><th className="p-4">حقوق پایه</th><th className="p-4">مزایا</th><th className="p-4">کسورات</th><th className="p-4">خالص</th><th className="p-4">مشاهده</th></tr></thead>
              <tbody>
                {payslips.length === 0 ? (
                  <tr><td colSpan="9" className="p-8 text-center text-gray-500">فیشی برای نمایش وجود ندارد.</td></tr>
                ) : payslips.map((item, index) => (
                  <tr key={item.id} className="border-t hover:bg-gray-50">
                    <td className="p-4">{index + 1}</td>
                    <td className="p-4 font-medium">{item.full_name || "نامشخص"}</td>
                    <td className="p-4">{item.personnel_code || "---"}</td>
                    <td className="p-4">{item.month} {item.year}</td>
                    <td className="p-4">{formatMoney(item.base_salary)} تومان</td>
                    <td className="p-4 text-green-600">{formatMoney(item.benefits)} تومان</td>
                    <td className="p-4 text-red-600">{formatMoney(item.deductions)} تومان</td>
                    <td className="p-4 font-bold text-purple-600">{formatMoney(item.net_salary)} تومان</td>
                    <td className="p-4"><a href={`/admin/payslips/${item.id}`} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">👁 مشاهده</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">سیستم حقوق و دستمزد — گزارش مالی شرکت {selectedCompany.name}</div>
      </div>
    </div>
  );
}
