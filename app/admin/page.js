"use client";

import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-6" dir="rtl">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            پنل مدیریت چابکان
          </h1>
          <p className="mt-2 text-gray-500">
            مدیریت کارکنان و فیش‌های حقوقی
          </p>
        </div>

        <Link
          href="/admin/login"
          className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          خروج
        </Link>
      </div>

      {/* Statistics */}
      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-gray-500">تعداد کارکنان</p>
          <h2 className="mt-2 text-3xl font-bold text-blue-600">0</h2>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-gray-500">فیش‌های صادر شده</p>
          <h2 className="mt-2 text-3xl font-bold text-green-600">0</h2>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-gray-500">فیش‌های اصلاح شده</p>
          <h2 className="mt-2 text-3xl font-bold text-orange-500">0</h2>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-gray-500">گزارش‌ها</p>
          <h2 className="mt-2 text-3xl font-bold text-purple-600">0</h2>
        </div>

      </div>

      {/* Menu */}
      <div>
        <h2 className="mb-5 text-xl font-bold text-gray-800">
          مدیریت سامانه
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

          <Link
            href="/admin/employees"
            className="rounded-xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="mb-3 text-3xl"></div>
            <h3 className="text-xl font-bold">کارکنان</h3>
            <p className="mt-2 text-gray-500">
              افزودن، ویرایش و مدیریت کارکنان
            </p>
          </Link>

          <Link
            href="/admin/payslips"
            className="rounded-xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="mb-3 text-3xl"></div>
            <h3 className="text-xl font-bold">فیش‌های حقوقی</h3>
            <p className="mt-2 text-gray-500">
              ایجاد و مدیریت فیش‌های حقوقی
            </p>
          </Link>

          <Link
            href="/admin/corrections"
            className="rounded-xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="mb-3 text-3xl"></div>
            <h3 className="text-xl font-bold">اصلاح فیش</h3>
            <p className="mt-2 text-gray-500">
              اصلاح و بررسی فیش‌های حقوقی
            </p>
          </Link>

          <Link
            href="/admin/reports"
            className="rounded-xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="mb-3 text-3xl"></div>
            <h3 className="text-xl font-bold">گزارش‌ها</h3>
            <p className="mt-2 text-gray-500">
              مشاهده گزارش‌های سامانه
            </p>
          </Link>

          <Link
            href="/admin/settings"
            className="rounded-xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="mb-3 text-3xl"></div>
            <h3 className="text-xl font-bold">تنظیمات</h3>
            <p className="mt-2 text-gray-500">
              تنظیمات سامانه مدیریت
            </p>
          </Link>

          <div className="rounded-xl bg-white p-6 shadow">
            <div className="mb-3 text-3xl"></div>
            <h3 className="text-xl font-bold">امنیت</h3>
            <p className="mt-2 text-gray-500">
              مدیریت دسترسی و امنیت پنل
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}