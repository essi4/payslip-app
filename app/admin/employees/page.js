"use client";

import { useState } from "react";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    nationalId: "",
    role: "",
    baseSalary: "",
  });

  const [editingId, setEditingId] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name || !form.nationalId || !form.role || !form.baseSalary) {
      alert("لطفاً همه اطلاعات را وارد کنید.");
      return;
    }

    if (editingId) {
      setEmployees(
        employees.map((employee) =>
          employee.id === editingId
            ? { ...employee, ...form }
            : employee
        )
      );

      setEditingId(null);
    } else {
      setEmployees([
        ...employees,
        {
          id: Date.now(),
          ...form,
        },
      ]);
    }

    setForm({
      name: "",
      nationalId: "",
      role: "",
      baseSalary: "",
    });
  };

  const handleEdit = (employee) => {
    setForm({
      name: employee.name,
      nationalId: employee.nationalId,
      role: employee.role,
      baseSalary: employee.baseSalary,
    });

    setEditingId(employee.id);
  };

  const handleDelete = (id) => {
    if (confirm("آیا از حذف این کارمند مطمئن هستید؟")) {
      setEmployees(employees.filter((employee) => employee.id !== id));
    }
  };

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.includes(search) ||
      employee.nationalId.includes(search)
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6" dir="rtl">

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          مدیریت کارکنان
        </h1>

        <p className="mt-2 text-gray-500">
          افزودن، جستجو، ویرایش و حذف کارکنان
        </p>
      </div>

      {/* فرم افزودن کارمند */}

      <div className="mb-8 rounded-xl bg-white p-6 shadow">

        <h2 className="mb-5 text-xl font-bold">
          {editingId ? "ویرایش کارمند" : "افزودن کارمند جدید"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >

          <input
            className="rounded-lg border p-3"
            placeholder="نام و نام خانوادگی"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <input
            className="rounded-lg border p-3"
            placeholder="کد ملی"
            maxLength={10}
            value={form.nationalId}
            onChange={(e) =>
              setForm({ ...form, nationalId: e.target.value })
            }
          />

          <input
            className="rounded-lg border p-3"
            placeholder="سمت"
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value })
            }
          />

          <input
            className="rounded-lg border p-3"
            placeholder="حقوق پایه"
            type="number"
            value={form.baseSalary}
            onChange={(e) =>
              setForm({ ...form, baseSalary: e.target.value })
            }
          />

          <div className="md:col-span-2 flex gap-3">

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              {editingId ? "ذخیره تغییرات" : "افزودن کارمند"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    name: "",
                    nationalId: "",
                    role: "",
                    baseSalary: "",
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
          onChange={(e) => setSearch(e.target.value)}
        />

      </div>

      {/* جدول کارکنان */}

      <div className="overflow-x-auto rounded-xl bg-white shadow">

        <table className="w-full text-right">

          <thead className="bg-gray-100">

            <tr>
              <th className="p-4">نام</th>
              <th className="p-4">کد ملی</th>
              <th className="p-4">سمت</th>
              <th className="p-4">حقوق پایه</th>
              <th className="p-4">عملیات</th>
            </tr>

          </thead>

          <tbody>

            {filteredEmployees.length === 0 ? (

              <tr>
                <td
                  colSpan="5"
                  className="p-8 text-center text-gray-500"
                >
                  هنوز کارمندی ثبت نشده است.
                </td>
              </tr>

            ) : (

              filteredEmployees.map((employee) => (

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
                    {employee.role}
                  </td>

                  <td className="p-4">
                    {Number(employee.baseSalary).toLocaleString()}
                  </td>

                  <td className="p-4">

                    <div className="flex gap-2">

                      <button
                        onClick={() => handleEdit(employee)}
                        className="rounded-lg bg-orange-500 px-3 py-2 text-white"
                      >
                        ویرایش
                      </button>

                      <button
                        onClick={() => handleDelete(employee.id)}
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