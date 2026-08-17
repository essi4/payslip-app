"use client";

import { useState } from "react";

export default function ReportsPage() {
  const [month, setMonth] = useState("مرداد 1405");

  const employees = [
    {
      id: 1,
      name: "علی علوی",
      nationalId: "1234567890",
      baseSalary: 70000000,
      benefits: 10000000,
      deductions: 5000000,
      netSalary: 75000000,
    },
    {
      id: 2,
      name: "محمد رضایی",
      nationalId: "9876543210",
      baseSalary: 60000000,
      benefits: 8000000,
      deductions: 4000000,
      netSalary: 64000000,
    },
  ];

  const totalNetSalary = employees.reduce(
    (total, employee) => total + employee.netSalary,
    0
  );

  const totalBaseSalary = employees.reduce(
    (total, employee) => total + employee.baseSalary,
    0
  );

  const totalBenefits = employees.reduce(
    (total, employee) => total + employee.benefits,
    0
  );

  const totalDeductions = employees.reduce(
    (total, employee) => total + employee.deductions,
    0
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6" dir="rtl">

      {/* عنوان */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          گزارش‌های حقوق و دستمزد
        </h1>

        <p className="mt-2 text-gray-500">
          مشاهده خلاصه وضعیت حقوق و فیش‌های کارکنان
        </p>
      </div>

      {/* انتخاب ماه */}

      <div className="mb-6 rounded-xl bg-white p-5 shadow">

        <label className="mb-2 block font-bold">
          ماه گزارش
        </label>

        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border p-3"
        >
          <option>مرداد 1405</option>
          <option>تیر 1405</option>
          <option>خرداد 1405</option>
          <option>اردیبهشت 1405</option>
          <option>فروردین 1405</option>
        </select>

      </div>

      {/* آمار */}

      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-gray-500">
            تعداد کارکنان
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-600">
            {employees.length}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-gray-500">
            مجموع حقوق پایه
          </p>

          <p className="mt-2 text-2xl font-bold">
            {totalBaseSalary.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-gray-500">
            مجموع مزایا
          </p>

          <p className="mt-2 text-2xl font-bold text-green-600">
            {totalBenefits.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-gray-500">
            مجموع کسورات
          </p>

          <p className="mt-2 text-2xl font-bold text-red-600">
            {totalDeductions.toLocaleString()}
          </p>
        </div>

      </div>

      {/* حقوق خالص */}

      <div className="mb-8 rounded-xl bg-green-50 p-6 shadow">

        <p className="text-gray-600">
          مجموع حقوق خالص - {month}
        </p>

        <p className="mt-2 text-4xl font-bold text-green-600">
          {totalNetSalary.toLocaleString()}
        </p>

      </div>

      {/* جدول */}

      <div className="overflow-x-auto rounded-xl bg-white shadow">

        <table className="w-full text-right">

          <thead className="bg-gray-100">

            <tr>
              <th className="p-4">نام</th>
              <th className="p-4">کد ملی</th>
              <th className="p-4">حقوق پایه</th>
              <th className="p-4">مزایا</th>
              <th className="p-4">کسورات</th>
              <th className="p-4">حقوق خالص</th>
            </tr>

          </thead>

          <tbody>

            {employees.map((employee) => (

              <tr
                key={employee.id}
                className="border-t"
              >

                <td className="p-4">
                  {employee.name}
                </td>

                <td className="p-4">
                  {employee.nationalId}
                </td>

                <td className="p-4">
                  {employee.baseSalary.toLocaleString()}
                </td>

                <td className="p-4">
                  {employee.benefits.toLocaleString()}
                </td>

                <td className="p-4 text-red-600">
                  {employee.deductions.toLocaleString()}
                </td>

                <td className="p-4 font-bold text-green-600">
                  {employee.netSalary.toLocaleString()}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}