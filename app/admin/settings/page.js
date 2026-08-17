"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    companyName: "عرصه ساز لب رود",
    fiscalYear: "1405",
    payslipTitle: "فیش حقوقی کارکنان",
    adminName: "مدیر سیستم",
  });

  const [message, setMessage] = useState("");

  const handleChange = (field, value) => {
    setSettings({
      ...settings,
      [field]: value,
    });
  };

  const handleSave = (e) => {
    e.preventDefault();

    setMessage("تنظیمات با موفقیت ذخیره شد.");

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6" dir="rtl">

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          تنظیمات سامانه
        </h1>

        <p className="mt-2 text-gray-500">
          مدیریت اطلاعات و تنظیمات پنل چابکان
        </p>
      </div>

      <div className="max-w-3xl rounded-xl bg-white p-6 shadow">

        <form onSubmit={handleSave}>

          <div className="mb-6">
            <label className="mb-2 block font-bold">
              نام شرکت
            </label>

            <input
              className="w-full rounded-lg border p-3"
              value={settings.companyName}
              onChange={(e) =>
                handleChange(
                  "companyName",
                  e.target.value
                )
              }
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block font-bold">
              سال مالی
            </label>

            <input
              className="w-full rounded-lg border p-3"
              value={settings.fiscalYear}
              onChange={(e) =>
                handleChange(
                  "fiscalYear",
                  e.target.value
                )
              }
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block font-bold">
              عنوان فیش حقوقی
            </label>

            <input
              className="w-full rounded-lg border p-3"
              value={settings.payslipTitle}
              onChange={(e) =>
                handleChange(
                  "payslipTitle",
                  e.target.value
                )
              }
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block font-bold">
              نام مدیر سیستم
            </label>

            <input
              className="w-full rounded-lg border p-3"
              value={settings.adminName}
              onChange={(e) =>
                handleChange(
                  "adminName",
                  e.target.value
                )
              }
            />
          </div>

          {message && (
            <div className="mb-5 rounded-lg bg-green-50 p-4 text-green-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700"
          >
            ذخیره تنظیمات
          </button>

        </form>

      </div>

    </div>
  );
}