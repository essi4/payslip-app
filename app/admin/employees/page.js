"use client";

import { useEffect, useMemo, useState } from "react";

const emptyForm = {
  name: "",
  nationalId: "",
  personnelCode: "",
  bankAccount: "",
  department: "",
  jobGroup: "",
  role: "",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  async function loadEmployees() {
    try {
      setLoading(true);

      const response = await fetch("/api/personnel", {
        cache: "no-store",
      });

      const result = await response.json();

      if (result.success) {
        setEmployees(result.data || []);
      } else {
        alert(result.error || "خطا در دریافت کارکنان");
      }
    } catch (error) {
      console.error(error);
      alert("خطا در اتصال به سرور");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  function updateForm(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.nationalId.trim() ||
      !form.personnelCode.trim() ||
      !form.department.trim() ||
      !form.role.trim()
    ) {
      alert("لطفاً اطلاعات اصلی کارمند را کامل وارد کنید.");
      return;
    }

    try {
      setSaving(true);

      const isEditing = editingId !== null;

      const response = await fetch("/api/personnel", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingId,
          full_name: form.name,
          national_id: form.nationalId,
          personnel_code: form.personnelCode,
          bank_account: form.bankAccount,
          department: form.department,
          job_group: form.jobGroup,
          job_title: form.role,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.error || "عملیات انجام نشد");
        return;
      }

      alert(
        isEditing
          ? "اطلاعات کارمند با موفقیت ویرایش شد."
          : "کارمند با موفقیت ثبت شد."
      );

      resetForm();
      await loadEmployees();
    } catch (error) {
      console.error(error);
      alert("خطا در اتصال به سرور");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(employee) {
    setForm({
      name: employee.full_name || "",
      nationalId: employee.national_id || "",
      personnelCode: employee.personnel_code || "",
      bankAccount: employee.bank_account || "",
      department: employee.department || "",
      jobGroup: employee.job_group || "",
      role: employee.job_title || "",
    });

    setEditingId(employee.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "آیا از حذف این کارمند مطمئن هستید؟"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch("/api/personnel", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.error || "حذف انجام نشد");
        return;
      }

      alert("کارمند با موفقیت حذف شد.");

      if (editingId === id) {
        resetForm();
      }

      await loadEmployees();
    } catch (error) {
      console.error(error);
      alert("خطا در اتصال به سرور");
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  const filteredEmployees = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return employees;
    }

    return employees.filter((employee) => {
      const values = [
        employee.full_name,
        employee.national_id,
        employee.personnel_code,
        employee.bank_account,
        employee.department,
        employee.job_group,
        employee.job_title,
      ];

      return values.some((value) =>
        String(value || "").toLowerCase().includes(keyword)
      );
    });
  }, [employees, search]);

  const totalEmployees = employees.length;
  const searchCount = filteredEmployees.length;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 px-4 py-6 md:px-8"
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-7 rounded-3xl bg-gradient-to-l from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 text-4xl">👥</div>

              <h1 className="text-3xl font-black">
                مدیریت کارکنان
              </h1>

              <p className="mt-2 text-blue-100">
                ثبت، جستجو، ویرایش و مدیریت اطلاعات کارکنان
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 px-6 py-4 backdrop-blur">
              <div className="text-sm text-blue-100">
                وضعیت سامانه
              </div>

              <div className="mt-1 flex items-center gap-2 text-lg font-bold">
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                فعال
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            icon="👥"
            title="تعداد کارکنان"
            value={totalEmployees}
            subtitle="کل کارکنان"
          />

          <StatCard
            icon="🔎"
            title="نتایج جستجو"
            value={searchCount}
            subtitle="نتایج مطابق فیلتر"
          />

          <StatCard
            icon="🟢"
            title="وضعیت سامانه"
            value="فعال"
            subtitle="سیستم آنلاین"
          />

          <StatCard
            icon="🔄"
            title="آخرین بروزرسانی"
            value="آنلاین"
            subtitle="اتصال به دیتابیس"
          />

        </div>

        {/* Form */}
        <section className="mb-7 rounded-3xl bg-white p-5 shadow-lg md:p-7">

          <div className="mb-6 flex items-center gap-3 border-b pb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
              {editingId !== null ? "✏️" : "➕"}
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-800">
                {editingId !== null
                  ? "ویرایش اطلاعات کارمند"
                  : "افزودن کارمند جدید"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                اطلاعات کارمند را با دقت وارد کنید
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
          >

            <Input
              label="نام و نام خانوادگی"
              placeholder="مثلاً اسماعیل البرزی"
              value={form.name}
              onChange={(value) => updateForm("name", value)}
            />

            <Input
              label="کد ملی"
              placeholder="مثلاً 1234567890"
              value={form.nationalId}
              maxLength={10}
              onChange={(value) => updateForm("nationalId", value)}
            />

            <Input
              label="کد پرسنلی"
              placeholder="مثلاً 123"
              value={form.personnelCode}
              onChange={(value) =>
                updateForm("personnelCode", value)
              }
            />

            <Input
              label="شماره حساب"
              placeholder="شماره حساب کارمند"
              value={form.bankAccount}
              onChange={(value) =>
                updateForm("bankAccount", value)
              }
            />

            <Input
              label="واحد سازمانی"
              placeholder="مثلاً منابع انسانی"
              value={form.department}
              onChange={(value) =>
                updateForm("department", value)
              }
            />

            <Input
              label="گروه شغلی"
              placeholder="مثلاً گروه 11"
              value={form.jobGroup}
              onChange={(value) =>
                updateForm("jobGroup", value)
              }
            />

            <Input
              label="عنوان شغلی"
              placeholder="مثلاً مدیر مالی"
              value={form.role}
              onChange={(value) => updateForm("role", value)}
            />

            <div className="flex items-end gap-3 md:col-span-2 lg:col-span-2">

              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-2xl bg-blue-600 px-5 py-3.5 font-bold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {saving
                  ? "⏳ در حال ذخیره..."
                  : editingId !== null
                  ? "💾 ذخیره تغییرات"
                  : "➕ ثبت کارمند"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl bg-slate-200 px-5 py-3.5 font-bold text-slate-700 transition hover:bg-slate-300"
                >
                  ✕ انصراف
                </button>
              )}

            </div>
          </form>
        </section>

        {/* Search */}
        <section className="mb-7 rounded-3xl bg-white p-5 shadow-lg md:p-7">

          <div className="mb-5">
            <h2 className="text-xl font-black text-slate-800">
              🔎 جستجو و فیلتر کارکنان
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              جستجو بر اساس نام، کد ملی، کد پرسنلی، شماره حساب،
              واحد یا سمت
            </p>
          </div>

          <div className="relative">
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl">
              🔍
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="نام، کد ملی، کد پرسنلی، شماره حساب یا سمت..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pr-12 pl-4 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

        </section>

        {/* Table */}
        <section className="overflow-hidden rounded-3xl bg-white shadow-lg">

          <div className="flex flex-col gap-3 border-b p-5 md:flex-row md:items-center md:justify-between md:p-7">

            <div>
              <h2 className="text-xl font-black text-slate-800">
                📋 فهرست کارکنان
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                کارکنان ثبت‌شده در سامانه
              </p>
            </div>

            <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
              {filteredEmployees.length.toLocaleString("fa-IR")} نفر
            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1100px] text-right">

              <thead className="bg-slate-50 text-sm text-slate-600">
                <tr>
                  <th className="px-5 py-4">#</th>
                  <th className="px-5 py-4">نام و نام خانوادگی</th>
                  <th className="px-5 py-4">کد ملی</th>
                  <th className="px-5 py-4">کد پرسنلی</th>
                  <th className="px-5 py-4">شماره حساب</th>
                  <th className="px-5 py-4">واحد</th>
                  <th className="px-5 py-4">گروه شغلی</th>
                  <th className="px-5 py-4">عنوان شغلی</th>
                  <th className="px-5 py-4">عملیات</th>
                </tr>
              </thead>

              <tbody>

                {loading ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="p-10 text-center text-slate-500"
                    >
                      ⏳ در حال دریافت اطلاعات...
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="p-10 text-center text-slate-500"
                    >
                      📭 کارمندی پیدا نشد.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee, index) => (
                    <tr
                      key={employee.id}
                      className="border-t transition hover:bg-blue-50/50"
                    >

                      <td className="px-5 py-4 font-bold text-slate-400">
                        {(index + 1).toLocaleString("fa-IR")}
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-800">
                        {employee.full_name || "-"}
                      </td>

                      <td className="px-5 py-4">
                        {employee.national_id || "-"}
                      </td>

                      <td className="px-5 py-4">
                        {employee.personnel_code || "-"}
                      </td>

                      <td className="px-5 py-4">
                        {employee.bank_account || "-"}
                      </td>

                      <td className="px-5 py-4">
                        {employee.department || "-"}
                      </td>

                      <td className="px-5 py-4">
                        {employee.job_group || "-"}
                      </td>

                      <td className="px-5 py-4">
                        {employee.job_title || "-"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex gap-2">

                          <button
                            type="button"
                            onClick={() => handleEdit(employee)}
                            className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-amber-600"
                          >
                            ✏️ ویرایش
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(employee.id)
                            }
                            className="rounded-xl bg-red-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-red-600"
                          >
                            🗑 حذف
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))
                )}

              </tbody>
            </table>

          </div>
        </section>

        {/* Footer */}
        <div className="py-7 text-center text-sm text-slate-500">
          سیستم حقوق و دستمزد — مدیریت کارکنان
        </div>

      </div>
    </main>
  );
}

function Input({
  label,
  placeholder,
  value,
  onChange,
  maxLength,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <input
        type="text"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function StatCard({ icon, title, value, subtitle }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-md transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-black text-slate-800">
            {typeof value === "number"
              ? value.toLocaleString("fa-IR")
              : value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {subtitle}
          </p>
        </div>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
          {icon}
        </div>
      </div>
    </div>
  );
}