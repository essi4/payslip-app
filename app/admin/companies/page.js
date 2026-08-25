"use client";

import { useEffect, useState } from "react";

const emptyForm = {
  name: "",
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  async function loadCompanies() {
    try {
      setLoading(true);

      const response = await fetch("/api/companies", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.error || "خطا در دریافت شرکت‌ها");
        return;
      }

      setCompanies(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error("LOAD COMPANIES ERROR:", error);
      alert("خطا در اتصال به سرور");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) {
      alert("نام شرکت را وارد کنید.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/companies", {
        method: editingId !== null ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingId,
          name,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.error || "ذخیره شرکت انجام نشد.");
        return;
      }

      alert(
        editingId !== null
          ? "شرکت با موفقیت ویرایش شد."
          : "شرکت با موفقیت ثبت شد."
      );

      resetForm();
      await loadCompanies();
    } catch (error) {
      console.error("SAVE COMPANY ERROR:", error);
      alert("خطا در اتصال به سرور.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(company) {
    setForm({
      name: company.name || "",
    });

    setEditingId(company.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDelete(company) {
    const confirmed = window.confirm(
      `آیا از حذف شرکت «${company.name}» مطمئن هستید؟`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch("/api/companies", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: company.id,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.error || "حذف شرکت انجام نشد.");
        return;
      }

      if (editingId === company.id) {
        resetForm();
      }

      await loadCompanies();

      alert("شرکت با موفقیت حذف شد.");
    } catch (error) {
      console.error("DELETE COMPANY ERROR:", error);
      alert("خطا در حذف شرکت.");
    }
  }

  const filteredCompanies = companies.filter((company) => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return true;
    }

    return String(company.name || "")
      .toLowerCase()
      .includes(value);
  });

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100";

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 px-3 py-5 text-slate-800 sm:px-5 lg:px-8"
    >
      <div className="mx-auto max-w-[1200px]">
        <section className="mb-5 overflow-hidden rounded-2xl bg-gradient-to-l from-indigo-700 via-indigo-600 to-violet-600 p-5 text-white shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-1 text-xs font-medium text-indigo-100">
                سیستم حقوق و دستمزد چابکان
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                مدیریت شرکت‌ها
              </h1>

              <p className="mt-1 text-sm text-indigo-100">
                ثبت و مدیریت شرکت‌های طرف قرارداد
              </p>
            </div>

            <div className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-center backdrop-blur">
              <div className="text-xs text-indigo-100">
                تعداد شرکت‌ها
              </div>

              <div className="mt-1 text-2xl font-extrabold">
                {companies.length.toLocaleString("fa-IR")}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">
                {editingId !== null ? "ویرایش شرکت" : "ثبت شرکت جدید"}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                نام شرکت الزامی است.
              </p>
            </div>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
              >
                انصراف از ویرایش
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">
                  نام شرکت *
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      name: event.target.value,
                    })
                  }
                  placeholder="مثلاً عرصه ساز لب رود"
                  className={inputClass}
                  autoComplete="off"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "در حال ذخیره..."
                    : editingId !== null
                    ? "ذخیره تغییرات"
                    : "＋ ثبت شرکت"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  پاک کردن
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">
                  فهرست شرکت‌ها
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {filteredCompanies.length.toLocaleString("fa-IR")} شرکت
                  نمایش داده می‌شود.
                </p>
              </div>

              <div className="w-full sm:w-80">
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="جستجوی نام شرکت..."
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] border-collapse text-right text-sm">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="px-4 py-3 text-center font-bold">ردیف</th>
                  <th className="px-4 py-3 font-bold">نام شرکت</th>
                  <th className="px-4 py-3 text-center font-bold">
                    تعداد پرسنل
                  </th>
                  <th className="px-4 py-3 text-center font-bold">
                    تاریخ ثبت
                  </th>
                  <th className="px-4 py-3 text-center font-bold">
                    عملیات
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-12 text-center text-sm text-slate-400"
                    >
                      در حال دریافت شرکت‌ها...
                    </td>
                  </tr>
                ) : filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center">
                      <div className="text-4xl">🏢</div>

                      <div className="mt-2 text-sm font-bold text-slate-500">
                        هنوز شرکتی ثبت نشده است
                      </div>

                      <div className="mt-1 text-xs text-slate-400">
                        از قسمت بالا شرکت جدید ثبت کنید.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((company, index) => (
                    <tr
                      key={company.id}
                      className="border-b border-slate-100 transition hover:bg-indigo-50/50"
                    >
                      <td className="px-4 py-3 text-center font-bold text-slate-400">
                        {(index + 1).toLocaleString("fa-IR")}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-lg">
                            🏢
                          </div>

                          <span className="font-bold text-slate-700">
                            {company.name || "-"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                          {Number(
                            company.employee_count || 0
                          ).toLocaleString("fa-IR")}{" "}
                          نفر
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center text-xs text-slate-500">
                        {company.created_at
                          ? new Date(
                              company.created_at
                            ).toLocaleDateString("fa-IR")
                          : "-"}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(company)}
                            className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
                          >
                            ویرایش
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(company)}
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

          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            <span>
              تعداد کل:
              <strong className="mr-1 text-slate-700">
                {companies.length.toLocaleString("fa-IR")}
              </strong>{" "}
              شرکت
            </span>

            <button
              type="button"
              onClick={loadCompanies}
              className="rounded-lg bg-white px-3 py-1.5 font-bold text-indigo-600 shadow-sm transition hover:bg-indigo-50"
            >
              ↻ بروزرسانی
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}