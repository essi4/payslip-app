"use client";

import { useState } from "react";

export default function CorrectionsPage() {
  const [nationalId, setNationalId] = useState("");
  const [payslip, setPayslip] = useState(null);
  const [message, setMessage] = useState("");

  const handleSearch = () => {
    setMessage("");

    if (!nationalId) {
      setMessage("لطفاً کد ملی را وارد کنید.");
      return;
    }

    // فیش آزمایشی برای تست
    setPayslip({
      name: "علی علوی",
      nationalId: nationalId,
      month: "مرداد 1405",
      baseSalary: 70000000,
      benefits: 10000000,
      deductions: 5000000,
    });
  };

  const calculateNet = () => {
    if (!payslip) return 0;

    return (
      Number(payslip.baseSalary || 0) +
      Number(payslip.benefits || 0) -
      Number(payslip.deductions || 0)
    );
  };

  const handleChange = (field, value) => {
    setPayslip({
      ...payslip,
      [field]: value,
    });
  };

  const handleSave = () => {
    setMessage("تغییرات فیش با موفقیت ثبت شد.");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6" dir="rtl">

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          اصلاح فیش حقوقی
        </h1>

        <p className="mt-2 text-gray-500">
          جستجو و اصلاح اطلاعات فیش حقوقی
        </p>
      </div>

      {/* جستجوی فیش */}

      <div className="mb-6 rounded-xl bg-white p-6 shadow">

        <h2 className="mb-4 text-xl font-bold">
          جستجوی فیش
        </h2>

        <div className="flex flex-col gap-3 md:flex-row">

          <input
            className="flex-1 rounded-lg border p-3"
            placeholder="کد ملی کارمند"
            maxLength={10}
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
          />

          <button
            onClick={handleSearch}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            جستجوی فیش
          </button>

        </div>

        {message && (
          <div className="mt-4 rounded-lg bg-blue-50 p-3 text-blue-700">
            {message}
          </div>
        )}

      </div>

      {/* اطلاعات فیش */}

      {payslip && (

        <div className="rounded-xl bg-white p-6 shadow">

          <h2 className="mb-6 text-xl font-bold">
            اطلاعات فیش
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-gray-600">
                نام کارمند
              </label>

              <input
                className="w-full rounded-lg border bg-gray-100 p-3"
                value={payslip.name}
                disabled
              />
            </div>

            <div>
              <label className="mb-2 block text-gray-600">
                کد ملی
              </label>

              <input
                className="w-full rounded-lg border bg-gray-100 p-3"
                value={payslip.nationalId}
                disabled
              />
            </div>

            <div>
              <label className="mb-2 block text-gray-600">
                ماه
              </label>

              <input
                className="w-full rounded-lg border bg-gray-100 p-3"
                value={payslip.month}
                disabled
              />
            </div>

            <div>
              <label className="mb-2 block text-gray-600">
                حقوق پایه
              </label>

              <input
                type="number"
                className="w-full rounded-lg border p-3"
                value={payslip.baseSalary}
                onChange={(e) =>
                  handleChange(
                    "baseSalary",
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-gray-600">
                مزایا
              </label>

              <input
                type="number"
                className="w-full rounded-lg border p-3"
                value={payslip.benefits}
                onChange={(e) =>
                  handleChange(
                    "benefits",
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-gray-600">
                کسورات
              </label>

              <input
                type="number"
                className="w-full rounded-lg border p-3"
                value={payslip.deductions}
                onChange={(e) =>
                  handleChange(
                    "deductions",
                    e.target.value
                  )
                }
              />
            </div>

          </div>

          {/* حقوق خالص */}

          <div className="mt-6 rounded-xl bg-green-50 p-5">

            <p className="text-gray-600">
              حقوق خالص پس از اصلاح
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {calculateNet().toLocaleString()}
            </p>

          </div>

          {/* ذخیره */}

          <button
            onClick={handleSave}
            className="mt-6 rounded-lg bg-green-600 px-8 py-3 text-white hover:bg-green-700"
          >
            ذخیره اصلاحات
          </button>

        </div>

      )}

    </div>
  );
}