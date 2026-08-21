"use client";

import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";

const emptyForm = {
  name: "",
  nationalId: "",
  personnelCode: "",
  bankAccount: "",
  department: "",
  jobGroup: "",
  role: "",
};

function textValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function getExcelValue(row, keys) {
  for (const key of keys) {
    if (
      row[key] !== undefined &&
      row[key] !== null &&
      String(row[key]).trim() !== ""
    ) {
      return textValue(row[key]);
    }
  }

  return "";
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const [editingId, setEditingId] = useState(null);

  // تعیین رمز عبور
  const [passwordEmployee, setPasswordEmployee] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const fileInputRef = useRef(null);

  async function loadEmployees() {
    try {
      setLoading(true);

      const response = await fetch("/api/personnel", {
        cache: "no-store",
      });

      const result = await response.json();

      if (result.success) {
        setEmployees(Array.isArray(result.data) ? result.data : []);
      } else {
        alert(result.error || "خطا در دریافت کارکنان");
      }
    } catch (error) {
      console.error("Load employees error:", error);
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

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("نام و نام خانوادگی را وارد کنید.");
      return;
    }

    if (!form.nationalId.trim()) {
      alert("کد ملی را وارد کنید.");
      return;
    }

    if (!form.personnelCode.trim()) {
      alert("کد پرسنلی را وارد کنید.");
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
          full_name: form.name.trim(),
          national_id: form.nationalId.trim(),
          personnel_code: form.personnelCode.trim(),
          bank_account: form.bankAccount.trim(),
          department: form.department.trim(),
          job_group: form.jobGroup.trim(),
          job_title: form.role.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.error || "عملیات انجام نشد.");
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
      console.error("Save employee error:", error);
      alert("خطا در اتصال به سرور.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(employee) {
    setForm({
      name: textValue(employee.full_name),
      nationalId: textValue(employee.national_id),
      personnelCode: textValue(employee.personnel_code),
      bankAccount: textValue(employee.bank_account),
      department: textValue(employee.department),
      jobGroup: textValue(employee.job_group),
      role: textValue(employee.job_title),
    });

    setEditingId(employee.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSetPassword() {
    if (!passwordEmployee) {
      return;
    }

    const password = newPassword.trim();

    if (!password) {
      alert("لطفاً رمز عبور را وارد کنید.");
      return;
    }

    if (password.length < 4) {
      alert("رمز عبور باید حداقل ۴ کاراکتر باشد.");
      return;
    }

    try {
      setSavingPassword(true);

      const response = await fetch("/api/personnel", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: passwordEmployee.id,
          full_name: textValue(passwordEmployee.full_name),
          national_id: textValue(passwordEmployee.national_id),
          personnel_code: textValue(passwordEmployee.personnel_code),
          department: textValue(passwordEmployee.department),
          job_title: textValue(passwordEmployee.job_title),
          bank_account: textValue(passwordEmployee.bank_account),
          job_group: textValue(passwordEmployee.job_group),
          payslip_password: password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.error || "تعیین رمز عبور انجام نشد.");
        return;
      }

      alert(
        "رمز عبور " +
          textValue(passwordEmployee.full_name) +
          " با موفقیت تعیین شد."
      );

      setPasswordEmployee(null);
      setNewPassword("");

      await loadEmployees();
    } catch (error) {
      console.error("Set password error:", error);
      alert("خطا در اتصال به سرور.");
    } finally {
      setSavingPassword(false);
    }
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
        body: JSON.stringify({
          id,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.error || "حذف انجام نشد.");
        return;
      }

      if (editingId === id) {
        resetForm();
      }

      await loadEmployees();
    } catch (error) {
      console.error("Delete employee error:", error);
      alert("خطا در حذف کارمند.");
    }
  }

  async function handleExcelImport(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setImporting(true);

      const data = await file.arrayBuffer();

      const workbook = XLSX.read(data, {
        type: "array",
      });

      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        alert("فایل Excel فاقد Sheet است.");
        return;
      }

      const worksheet = workbook.Sheets[sheetName];

      const rows = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
      });

      if (!rows.length) {
        alert("فایل Excel خالی است.");
        return;
      }

      const importedEmployees = rows
        .map((row) => ({
          full_name: getExcelValue(row, [
            "نام و نام خانوادگی",
            "نام",
            "full_name",
            "FullName",
          ]),

          national_id: getExcelValue(row, [
            "کد ملی",
            "کدملی",
            "national_id",
            "NationalID",
          ]),

          personnel_code: getExcelValue(row, [
            "کد پرسنلی",
            "کدپرسنلی",
            "personnel_code",
            "PersonnelCode",
          ]),

          bank_account: getExcelValue(row, [
            "شماره حساب",
            "حساب بانکی",
            "bank_account",
            "BankAccount",
          ]),

          department: getExcelValue(row, [
            "واحد",
            "واحد سازمانی",
            "department",
            "Department",
          ]),

          job_group: getExcelValue(row, [
            "گروه شغلی",
            "گروه",
            "job_group",
            "JobGroup",
          ]),

          job_title: getExcelValue(row, [
            "عنوان شغلی",
            "سمت",
            "job_title",
            "JobTitle",
          ]),
        }))
        .filter(
          (employee) =>
            employee.full_name &&
            employee.national_id &&
            employee.personnel_code
        );

      if (!importedEmployees.length) {
        alert(
          "هیچ ردیف معتبری پیدا نشد.\n\nستون‌های نام، کد ملی و کد پرسنلی را بررسی کنید."
        );
        return;
      }

      const confirmed = window.confirm(
        importedEmployees.length.toLocaleString("fa-IR") +
          " پرسنل از Excel شناسایی شد.\n\nآیا ثبت گروهی را شروع می‌کنید؟"
      );

      if (!confirmed) {
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const employee of importedEmployees) {
        try {
          const response = await fetch("/api/personnel", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(employee),
          });

          const result = await response.json();

          if (response.ok && result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(error);
          errorCount++;
        }
      }

      await loadEmployees();

      alert(
        "ورود گروهی Excel تمام شد.\n\n" +
          "ثبت موفق: " +
          successCount.toLocaleString("fa-IR") +
          "\n" +
          "ثبت ناموفق: " +
          errorCount.toLocaleString("fa-IR")
      );
    } catch (error) {
      console.error("Excel import error:", error);

      alert(
        "خطا در خواندن فایل Excel.\n\nمطمئن شوید فایل دارای اطلاعات صحیح است."
      );
    } finally {
      setImporting(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function downloadExcelTemplate() {
    const data = [
      {
        "نام و نام خانوادگی": "علی رضایی",
        "کد ملی": "0012345678",
        "کد پرسنلی": "1001",
        "شماره حساب": "6037991234567890",
        "واحد": "مالی",
        "گروه شغلی": "کارشناس",
        "عنوان شغلی": "کارشناس مالی",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "کارکنان"
    );

    XLSX.writeFile(
      workbook,
      "template-employees.xlsx"
    );
  }

  const filteredEmployees = employees.filter((employee) => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return true;
    }

    return [
      employee.full_name,
      employee.national_id,
      employee.personnel_code,
      employee.department,
      employee.job_group,
      employee.job_title,
      employee.bank_account,
    ]
      .map((item) => textValue(item).toLowerCase())
      .some((item) => item.includes(value));
  });

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100";

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 px-3 py-5 text-slate-800 sm:px-5 lg:px-8"
    >
      <div className="mx-auto max-w-[1600px]">

        {/* Header */}
        <section className="mb-5 overflow-hidden rounded-2xl bg-gradient-to-l from-indigo-700 via-indigo-600 to-violet-600 p-5 text-white shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="mb-1 text-xs font-medium text-indigo-100">
                سیستم حقوق و دستمزد چابکان
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                مدیریت کارکنان
              </h1>

              <p className="mt-1 text-sm text-indigo-100">
                ثبت، ویرایش، جستجو و ورود گروهی اطلاعات کارکنان
              </p>
            </div>

            <div className="flex items-center gap-3">

              <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-center backdrop-blur">
                <div className="text-xs text-indigo-100">
                  تعداد کارکنان
                </div>

                <div className="mt-0.5 text-xl font-extrabold">
                  {employees.length.toLocaleString("fa-IR")}
                </div>
              </div>

              <button
                type="button"
                onClick={loadEmployees}
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-lg transition hover:bg-indigo-50"
              >
                ↻ بروزرسانی
              </button>

            </div>
          </div>
        </section>

        {/* Form + Excel */}
        <section className="mb-5 grid gap-5 xl:grid-cols-[1fr_320px]">

          {/* Employee Form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">

              <div>
                <h2 className="text-lg font-extrabold text-slate-800">
                  {editingId !== null
                    ? "ویرایش اطلاعات کارمند"
                    : "ثبت کارمند جدید"}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  فیلدهای ستاره‌دار الزامی هستند
                </p>
              </div>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200"
                >
                  انصراف از ویرایش
                </button>
              )}

            </div>

            <form onSubmit={handleSubmit}>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    نام و نام خانوادگی *
                  </label>

                  <input
                    className={inputClass}
                    value={form.name}
                    onChange={(event) =>
                      updateForm("name", event.target.value)
                    }
                    placeholder="مثلاً علی رضایی"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    کد ملی *
                  </label>

                  <input
                    className={inputClass}
                    value={form.nationalId}
                    onChange={(event) =>
                      updateForm(
                        "nationalId",
                        event.target.value
                      )
                    }
                    placeholder="۱۰ رقمی"
                    inputMode="numeric"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    کد پرسنلی *
                  </label>

                  <input
                    className={inputClass}
                    value={form.personnelCode}
                    onChange={(event) =>
                      updateForm(
                        "personnelCode",
                        event.target.value
                      )
                    }
                    placeholder="مثلاً 1001"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    شماره حساب
                  </label>

                  <input
                    className={inputClass}
                    value={form.bankAccount}
                    onChange={(event) =>
                      updateForm(
                        "bankAccount",
                        event.target.value
                      )
                    }
                    placeholder="شماره حساب"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    واحد سازمانی
                  </label>

                  <input
                    className={inputClass}
                    value={form.department}
                    onChange={(event) =>
                      updateForm(
                        "department",
                        event.target.value
                      )
                    }
                    placeholder="مثلاً مالی"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    گروه شغلی
                  </label>

                  <input
                    className={inputClass}
                    value={form.jobGroup}
                    onChange={(event) =>
                      updateForm(
                        "jobGroup",
                        event.target.value
                      )
                    }
                    placeholder="مثلاً کارشناس"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    عنوان شغلی
                  </label>

                  <input
                    className={inputClass}
                    value={form.role}
                    onChange={(event) =>
                      updateForm(
                        "role",
                        event.target.value
                      )
                    }
                    placeholder="مثلاً کارشناس منابع انسانی"
                  />
                </div>

              </div>

              <div className="mt-5 flex flex-wrap gap-2">

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "در حال ذخیره..."
                    : editingId !== null
                    ? "ذخیره تغییرات"
                    : "＋ ثبت کارمند"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  پاک کردن فرم
                </button>

              </div>
            </form>
          </div>

          {/* Excel */}
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">

            <div className="mb-4 flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-xs font-extrabold text-white shadow">
                Excel
              </div>

              <div>
                <h2 className="font-extrabold text-slate-800">
                  ورود گروهی
                </h2>

                <p className="text-xs text-slate-500">
                  ثبت چندین کارمند با فایل Excel
                </p>
              </div>

            </div>

            <div className="rounded-xl border border-dashed border-emerald-300 bg-white p-4 text-center">

              <p className="text-xs leading-6 text-slate-500">
                فایل Excel را انتخاب کنید.
                <br />
                نام، کد ملی و کد پرسنلی الزامی است.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelImport}
                className="hidden"
              />

              <button
                type="button"
                disabled={importing}
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {importing
                  ? "در حال ورود اطلاعات..."
                  : "انتخاب فایل Excel"}
              </button>

              <button
                type="button"
                onClick={downloadExcelTemplate}
                className="mt-2 w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
              >
                ↓ دانلود نمونه Excel
              </button>

            </div>
          </div>

        </section>

        {/* Password Modal */}
        {passwordEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

              <div className="mb-5 flex items-center justify-between">

                <div>
                  <h3 className="text-lg font-extrabold text-slate-800">
                    🔑 تعیین رمز ورود
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {textValue(passwordEmployee.full_name)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPasswordEmployee(null);
                    setNewPassword("");
                  }}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-slate-500 hover:bg-slate-200"
                >
                  ✕
                </button>

              </div>

              <div className="mb-4 rounded-xl bg-indigo-50 p-3 text-xs text-indigo-700">
                کد پرسنلی:{" "}
                <strong>
                  {textValue(
                    passwordEmployee.personnel_code
                  ) || "-"}
                </strong>
              </div>

              <div>

                <label className="mb-1.5 block text-xs font-bold text-slate-600">
                  رمز ورود کارمند
                </label>

                <input
                  type="text"
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(event.target.value)
                  }
                  placeholder="مثلاً 123456"
                  className={inputClass}
                  autoFocus
                />

                <p className="mt-2 text-[11px] text-slate-400">
                  حداقل ۴ کاراکتر وارد کنید.
                </p>

              </div>

              <div className="mt-5 flex gap-2">

                <button
                  type="button"
                  onClick={handleSetPassword}
                  disabled={savingPassword}
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingPassword
                    ? "در حال ذخیره..."
                    : "✓ ذخیره رمز"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPasswordEmployee(null);
                    setNewPassword("");
                  }}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200"
                >
                  انصراف
                </button>

              </div>

            </div>
          </div>
        )}

        {/* Employees Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 p-4 sm:p-5">

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <h2 className="text-lg font-extrabold text-slate-800">
                  فهرست کارکنان
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {filteredEmployees.length.toLocaleString(
                    "fa-IR"
                  )}{" "}
                  رکورد نمایش داده می‌شود
                </p>
              </div>

              <div className="relative w-full lg:w-80">

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="جستجو نام، کد ملی، کد پرسنلی..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />

                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  🔎
                </span>

              </div>
            </div>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1100px] border-collapse text-right text-[12px]">

              <thead>
                <tr className="bg-slate-800 text-white">

                  <th className="px-3 py-3 text-center font-bold">
                    ردیف
                  </th>

                  <th className="px-3 py-3 font-bold">
                    نام و نام خانوادگی
                  </th>

                  <th className="px-3 py-3 font-bold">
                    کد ملی
                  </th>

                  <th className="px-3 py-3 font-bold">
                    کد پرسنلی
                  </th>

                  <th className="px-3 py-3 font-bold">
                    شماره حساب
                  </th>

                  <th className="px-3 py-3 font-bold">
                    واحد
                  </th>

                  <th className="px-3 py-3 font-bold">
                    گروه شغلی
                  </th>

                  <th className="px-3 py-3 font-bold">
                    عنوان شغلی
                  </th>

                  <th className="px-3 py-3 text-center font-bold">
                    عملیات
                  </th>

                </tr>
              </thead>

              <tbody>

                {loading ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="py-12 text-center text-sm text-slate-400"
                    >
                      در حال دریافت اطلاعات کارکنان...
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="py-12 text-center"
                    >
                      <div className="text-3xl">
                        👤
                      </div>

                      <div className="mt-2 text-sm font-bold text-slate-500">
                        کارمندی پیدا نشد
                      </div>

                      <div className="mt-1 text-xs text-slate-400">
                        برای شروع، کارمند جدید ثبت کنید یا Excel وارد کنید.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee, index) => (
                    <tr
                      key={employee.id}
                      className="border-b border-slate-100 transition hover:bg-indigo-50/50"
                    >

                      <td className="px-3 py-3 text-center font-bold text-slate-400">
                        {(index + 1).toLocaleString(
                          "fa-IR"
                        )}
                      </td>

                      <td className="px-3 py-3 font-bold text-slate-700">
                        {textValue(employee.full_name) || "-"}
                      </td>

                      <td className="px-3 py-3 font-mono text-slate-600">
                        {textValue(employee.national_id) || "-"}
                      </td>

                      <td className="px-3 py-3">
                        <span className="rounded-lg bg-indigo-50 px-2.5 py-1 font-bold text-indigo-700">
                          {textValue(
                            employee.personnel_code
                          ) || "-"}
                        </span>
                      </td>

                      <td className="px-3 py-3 font-mono text-slate-600">
                        {textValue(
                          employee.bank_account
                        ) || "-"}
                      </td>

                      <td className="px-3 py-3 text-slate-600">
                        {textValue(
                          employee.department
                        ) || "-"}
                      </td>

                      <td className="px-3 py-3">
                        {textValue(employee.job_group) ? (
                          <span className="rounded-lg bg-violet-50 px-2 py-1 font-semibold text-violet-700">
                            {textValue(
                              employee.job_group
                            )}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="px-3 py-3 text-slate-600">
                        {textValue(
                          employee.job_title
                        ) || "-"}
                      </td>

                      {/* عملیات - فقط یک بار */}
                      <td className="px-3 py-3">

                        <div className="flex items-center justify-center gap-1.5">

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(employee)
                            }
                            className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
                          >
                            ویرایش
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setPasswordEmployee(
                                employee
                              );
                              setNewPassword("");
                            }}
                            className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
                          >
                            🔑 تعیین رمز
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(employee.id)
                            }
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
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

          <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">

            <span>
              تعداد کل:{" "}
              <strong className="text-slate-700">
                {employees.length.toLocaleString("fa-IR")}
              </strong>{" "}
              نفر
            </span>

            <span>
              نمایش:{" "}
              <strong className="text-indigo-600">
                {filteredEmployees.length.toLocaleString(
                  "fa-IR"
                )}
              </strong>{" "}
              نفر
            </span>

          </div>

        </section>
      </div>
    </main>
  );
}