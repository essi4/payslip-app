"use client";

import { useState } from "react";

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState([]);

  const [form, setForm] = useState({
    nationalId: "",
    name: "",
    month: "",
    baseSalary: "",
    benefits: "",
    deductions: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const calculateNetSalary = () => {
    const baseSalary = Number(form.baseSalary) || 0;
    const benefits = Number(form.benefits) || 0;
    const deductions = Number(form.deductions) || 0;

    return baseSalary + benefits - deductions;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !form.nationalId ||
      !form.name ||
      !form.month ||
      !form.baseSalary
    ) {
      alert("لطفاً اطلاعات اصلی فیش را وارد کنید.");
      return;
    }

    const payslip = {
      id: editingId || Date.now(),
      ...form,
      netSalary: calculateNetSalary(),
    };

    if (editingId) {
      setPayslips(
        payslips.map((item) =>
          item.id === editingId ? payslip : item
        )
      );

      setEditingId(null);
    } else {
      setPayslips([...payslips, payslip]);
    }

    setForm({
      nationalId: "",
      name: "",
      month: "",
      baseSalary: "",
      benefits: "",
      deductions: "",
    });
  };

  const handleEdit = (payslip) => {
    setForm({
      nationalId: payslip.nationalId,
      name: payslip.name,
      month: payslip.month,
      baseSalary: payslip.baseSalary,
      benefits: payslip.benefits,
      deductions: payslip.deductions,
    });

    setEditingId(payslip.id);
  };

  const handleDelete = (id) => {
    if (confirm("آیا از حذف این فیش مطمئن هستید؟")) {
      setPayslips(
        payslips.filter((item) => item.id !== id)
      );
    }
  };

  const filteredPayslips = payslips.filter(
    (item) =>
      item.name.includes(search) ||
      item.nationalId.includes(search)
  );

  const currentNetSalary = calculateNetSalary();

  return (
    <div className="min-h-screen bg-gray-100 p-6" dir="rtl">

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          مدیریت فیش‌های حقوقی
        </h1>

        <p className="mt-2 text-gray-500">
          ایجاد، مشاهده، ویرایش و حذف فیش حقوقی
        </p>
      </div>

      {/* فرم فیش */}

      <div className="mb-8 rounded-xl bg-white p-6 shadow">

        <h2 className="mb-5 text-xl font-bold">
          {editingId
            ? "ویرایش فیش حقوقی"
            : "ایجاد فیش حقوقی جدید"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >

          <input
            className="rounded-lg border p-3"
            placeholder="کد ملی"
            maxLength={10}
            value={form.nationalId}
            onChange={(e) =>
              setForm({
                ...form,
                nationalId: e.target.value,
              })
            }
          />

          <input
            className="rounded-lg border p-3"
            placeholder="نام و نام خانوادگی"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
          />

          <input
            className="rounded-lg border p-3"
            placeholder="ماه فیش - مثال: مرداد 1405"
            value={form.month}
            onChange={(e) =>
              setForm({
                ...form,
                month: e.target.value,
              })
            }
          />

          <input
            className="rounded-lg border p-3"
            placeholder="حقوق پایه"
            type="number"
            value={form.baseSalary}
            onChange={(e) =>
              setForm({
                ...form,
                baseSalary: e.target.value,
              })
            }
          />

          <input
            className="rounded-lg border p-3"
            placeholder="مزایا"
            type="number"
            value={form.benefits}
            onChange={(e) =>
              setForm({
                ...form,
                benefits: e.target.value,
              })
            }
          />

          <input
            className="rounded-lg border p-3"
            placeholder="کسورات"
            type="number"
            value={form.deductions}
            onChange={(e) =>
              setForm({
                ...form,
                deductions: e.target.value,
              })
            }
          />

          {/* حقوق خالص */}

          <div className="rounded-lg bg-green-50 p-4 md:col-span-2">

            <p className="text-gray-600">
              حقوق خالص
            </p>

            <p className="mt-1 text-2xl font-bold text-green-600">
              {currentNetSalary.toLocaleString()}
            </p>

          </div>

          <div className="flex gap-3 md:col-span-2">

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              {editingId
                ? "ذخیره تغییرات"
                : "ثبت فیش"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);

                  setForm({
                    nationalId: "",
                    name: "",
                    month: "",
                    baseSalary: "",
                    benefits: "",
                    deductions: "",
                  });
                }}
                className="rounded-lg bg-gray-500 px-6 py-3 text-white"
              >
                انصراف
              </button>
            )}

          </div>

        </form>

      </div>

      {/* جستجو */}

      <div className="mb-5 rounded-xl bg-white p-5 shadow">

        <input
          className="w-full rounded-lg border p-3"
          placeholder="جستجو با نام یا کد ملی..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

      </div>

      {/* جدول فیش‌ها */}

      <div className="overflow-x-auto rounded-xl bg-white shadow">

        <table className="w-full text-right">

          <thead className="bg-gray-100">

            <tr>
              <th className="p-4">نام</th>
              <th className="p-4">کد ملی</th>
              <th className="p-4">ماه</th>
              <th className="p-4">حقوق پایه</th>
              <th className="p-4">مزایا</th>
              <th className="p-4">کسورات</th>
              <th className="p-4">خالص</th>
              <th className="p-4">عملیات</th>
            </tr>

          </thead>

          <tbody>

            {filteredPayslips.length === 0 ? (

              <tr>
                <td
                  colSpan="8"
                  className="p-8 text-center text-gray-500"
                >
                  هنوز فیشی ثبت نشده است.
                </td>
              </tr>

            ) : (

              filteredPayslips.map((item) => (

                <tr
                  key={item.id}
                  className="border-t"
                >

                  <td className="p-4">
                    {item.name}
                  </td>

                  <td className="p-4">
                    {item.nationalId}
                  </td>

                  <td className="p-4">
                    {item.month}
                  </td>

                  <td className="p-4">
                    {Number(
                      item.baseSalary
                    ).toLocaleString()}
                  </td>

                  <td className="p-4">
                    {Number(
                      item.benefits
                    ).toLocaleString()}
                  </td>

                  <td className="p-4">
                    {Number(
                      item.deductions
                    ).toLocaleString()}
                  </td>

                  <td className="p-4 font-bold text-green-600">
                    {Number(
                      item.netSalary
                    ).toLocaleString()}
                  </td>

                  <td className="p-4">

                    <div className="flex gap-2">

                      <button
                        onClick={() =>
                          handleEdit(item)
                        }
                        className="rounded-lg bg-orange-500 px-3 py-2 text-white"
                      >
                        ویرایش
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(item.id)
                        }
                        className="rounded-lg bg-red-500 px-3 py-2 text-white"
                      >
                        حذف
                      </button>

                    </div>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}