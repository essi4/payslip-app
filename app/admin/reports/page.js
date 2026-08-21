"use client";

import { useEffect, useState } from "react";

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);

  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");

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

  async function loadReports() {
    try {
      setLoading(true);

      let url = "/api/reports";

      const params = new URLSearchParams();

      if (year) {
        params.append("year", year);
      }

      if (month) {
        params.append("month", month);
      }

      if (params.toString()) {
        url += "?" + params.toString();
      }

      const response = await fetch(url, {
        cache: "no-store",
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.error || "خطا در دریافت گزارش");
        return;
      }

      setReport(result.data);
    } catch (error) {
      console.error(error);
      alert("خطا در اتصال به سرور");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, [year, month]);

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

  if (loading) {
    return (
      <div
        className="min-h-screen bg-gray-100 p-10 text-center"
        dir="rtl"
      >
        <div className="rounded-xl bg-white p-10 shadow">
          <div className="text-4xl">📊</div>

          <h2 className="mt-4 text-xl font-bold">
            در حال دریافت گزارش‌ها...
          </h2>

          <p className="mt-2 text-gray-500">
            لطفاً چند لحظه صبر کنید
          </p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div
        className="min-h-screen bg-gray-100 p-10 text-center"
        dir="rtl"
      >
        <div className="rounded-xl bg-white p-10 shadow">
          <h2 className="text-xl font-bold">
            گزارشی دریافت نشد
          </h2>

          <button
            onClick={loadReports}
            className="mt-5 rounded-lg bg-blue-600 px-6 py-3 text-white"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  const summary = report.summary || {};
  const payslips = report.payslips || [];
  const monthly = report.monthly || [];

  return (
    <div
      className="min-h-screen bg-gray-100 p-6"
      dir="rtl"
    >
      {/* HEADER */}

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            📊 گزارش‌های حقوق و دستمزد
          </h1>

          <p className="mt-2 text-gray-500">
            گزارش کامل فیش‌ها، حقوق، مزایا و کسورات
          </p>
        </div>

        <button
          onClick={printReport}
          className="rounded-lg bg-gray-800 px-6 py-3 text-white hover:bg-gray-900"
        >
          🖨 چاپ گزارش
        </button>
      </div>

      {/* FILTER */}

      <div className="mb-8 rounded-xl bg-white p-6 shadow">
        <h2 className="mb-5 text-xl font-bold">
          🔎 فیلتر گزارش
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block font-medium">
              سال
            </label>

            <input
              type="text"
              placeholder="مثلاً 1405"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              ماه
            </label>

            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full rounded-lg border p-3"
            >
              <option value="">
                همه ماه‌ها
              </option>

              {months.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full rounded-lg bg-gray-500 px-5 py-3 text-white hover:bg-gray-600"
            >
              پاک کردن فیلتر
            </button>
          </div>
        </div>
      </div>

      {/* STATISTICS */}

      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-gray-500">
            👥 تعداد کارکنان
          </p>

          <h2 className="mt-2 text-3xl font-bold text-blue-600">
            {formatMoney(summary.employeesCount)}
          </h2>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-gray-500">
            📄 تعداد فیش‌ها
          </p>

          <h2 className="mt-2 text-3xl font-bold text-green-600">
            {formatMoney(summary.payslipsCount)}
          </h2>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-gray-500">
            💰 مجموع حقوق پایه
          </p>

          <h2 className="mt-2 text-2xl font-bold text-indigo-600">
            {formatMoney(summary.totalBaseSalary)}
          </h2>

          <span className="text-gray-500">
            تومان
          </span>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-gray-500">
            🎁 مجموع مزایا
          </p>

          <h2 className="mt-2 text-2xl font-bold text-emerald-600">
            {formatMoney(summary.totalBenefits)}
          </h2>

          <span className="text-gray-500">
            تومان
          </span>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-gray-500">
            ➖ مجموع کسورات
          </p>

          <h2 className="mt-2 text-2xl font-bold text-red-600">
            {formatMoney(summary.totalDeductions)}
          </h2>

          <span className="text-gray-500">
            تومان
          </span>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-gray-500">
            💵 مجموع خالص پرداختی
          </p>

          <h2 className="mt-2 text-2xl font-bold text-purple-600">
            {formatMoney(summary.totalNetSalary)}
          </h2>

          <span className="text-gray-500">
            تومان
          </span>
        </div>
      </div>

      {/* MONTHLY REPORT */}

      <div className="mb-8 overflow-hidden rounded-xl bg-white shadow">
        <div className="border-b p-6">
          <h2 className="text-xl font-bold">
            📅 گزارش دوره‌ای
          </h2>

          <p className="mt-1 text-gray-500">
            خلاصه حقوق و پرداختی بر اساس دوره
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4">سال</th>
                <th className="p-4">ماه</th>
                <th className="p-4">تعداد فیش</th>
                <th className="p-4">حقوق پایه</th>
                <th className="p-4">مزایا</th>
                <th className="p-4">کسورات</th>
                <th className="p-4">خالص پرداختی</th>
              </tr>
            </thead>

            <tbody>
              {monthly.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="p-8 text-center text-gray-500"
                  >
                    اطلاعاتی برای نمایش وجود ندارد.
                  </td>
                </tr>
              ) : (
                monthly.map((item, index) => (
                  <tr
                    key={`${item.year}-${item.month}-${index}`}
                    className="border-t"
                  >
                    <td className="p-4">
                      {item.year}
                    </td>

                    <td className="p-4 font-medium">
                      {item.month}
                    </td>

                    <td className="p-4">
                      {formatMoney(
                        item.payslips_count
                      )}
                    </td>

                    <td className="p-4">
                      {formatMoney(
                        item.base_salary
                      )}{" "}
                      تومان
                    </td>

                    <td className="p-4 text-green-600">
                      {formatMoney(
                        item.benefits
                      )}{" "}
                      تومان
                    </td>

                    <td className="p-4 text-red-600">
                      {formatMoney(
                        item.deductions
                      )}{" "}
                      تومان
                    </td>

                    <td className="p-4 font-bold text-purple-600">
                      {formatMoney(
                        item.net_salary
                      )}{" "}
                      تومان
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAYSLIPS */}

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <div className="border-b p-6">
          <h2 className="text-xl font-bold">
            📄 جزئیات فیش‌ها
          </h2>

          <p className="mt-1 text-gray-500">
            لیست فیش‌های موجود در گزارش
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4">#</th>
                <th className="p-4">کارمند</th>
                <th className="p-4">کد پرسنلی</th>
                <th className="p-4">دوره</th>
                <th className="p-4">حقوق پایه</th>
                <th className="p-4">مزایا</th>
                <th className="p-4">کسورات</th>
                <th className="p-4">خالص</th>
                <th className="p-4">مشاهده</th>
              </tr>
            </thead>

            <tbody>
              {payslips.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="p-8 text-center text-gray-500"
                  >
                    فیشی برای نمایش وجود ندارد.
                  </td>
                </tr>
              ) : (
                payslips.map((item, index) => {
                  const benefits =
                    Number(item.overtime || 0) +
                    Number(item.bonus || 0) +
                    Number(
                      item.housing_allowance || 0
                    ) +
                    Number(
                      item.food_allowance || 0
                    ) +
                    Number(
                      item.marriage_allowance || 0
                    ) +
                    Number(
                      item.child_allowance || 0
                    ) +
                    Number(
                      item.other_benefits || 0
                    );

                  const deductions =
                    Number(item.insurance || 0) +
                    Number(item.tax || 0) +
                    Number(
                      item.other_deductions || 0
                    );

                  return (
                    <tr
                      key={item.id}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="p-4">
                        {index + 1}
                      </td>

                      <td className="p-4 font-medium">
                        {item.full_name || "نامشخص"}
                      </td>

                      <td className="p-4">
                        {item.personnel_code || "---"}
                      </td>

                      <td className="p-4">
                        {item.month} {item.year}
                      </td>

                      <td className="p-4">
                        {formatMoney(
                          item.base_salary
                        )}{" "}
                        تومان
                      </td>

                      <td className="p-4 text-green-600">
                        {formatMoney(benefits)} تومان
                      </td>

                      <td className="p-4 text-red-600">
                        {formatMoney(deductions)} تومان
                      </td>

                      <td className="p-4 font-bold text-purple-600">
                        {formatMoney(
                          item.net_salary
                        )}{" "}
                        تومان
                      </td>

                      <td className="p-4">
                        <a
                          href={`/admin/payslips/${item.id}`}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                        >
                          👁 مشاهده
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER */}

      <div className="mt-8 text-center text-sm text-gray-500">
        سیستم حقوق و دستمزد — گزارش‌های مالی
      </div>
    </div>
  );
}