"use client";

import { useEffect, useMemo, useState } from "react";
import "./corrections.css";

export default function CorrectionsPage() {
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");

  const [editingId, setEditingId] = useState(null);

  const emptyForm = {
    year: "1405",
    month: "فروردین",

    bank_account: "",
    job_group: "",
    job_title: "",

    base_salary: "",
    overtime: "",
    bonus: "",

    housing_allowance: "",
    food_allowance: "",
    marriage_allowance: "",
    child_allowance: "",
    other_benefits: "",

    insurance: "",
    tax: "",
    other_deductions: "",
  };

  const [form, setForm] = useState(emptyForm);

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

  function number(value) {
    return Number(value) || 0;
  }

  function formatMoney(value) {
    return number(value).toLocaleString("fa-IR");
  }

  async function loadCorrections() {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (year) {
        params.set("year", year);
      }

      if (month) {
        params.set("month", month);
      }

      const response = await fetch(
        `/api/corrections?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "خطا در دریافت فیش‌ها"
        );
      }

      setCorrections(result.data || []);
    } catch (error) {
      console.error(error);
      alert(
        error.message ||
          "خطا در اتصال به سرور"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCorrections();
  }, []);

  const totalBase = useMemo(() => {
    return corrections.reduce(
      (sum, item) =>
        sum + number(item.base_salary),
      0
    );
  }, [corrections]);

  const totalBenefits = useMemo(() => {
    return corrections.reduce(
      (sum, item) =>
        sum +
        number(item.overtime) +
        number(item.bonus) +
        number(item.housing_allowance) +
        number(item.food_allowance) +
        number(item.marriage_allowance) +
        number(item.child_allowance) +
        number(item.other_benefits),
      0
    );
  }, [corrections]);

  const totalDeductions = useMemo(() => {
    return corrections.reduce(
      (sum, item) =>
        sum +
        number(item.insurance) +
        number(item.tax) +
        number(item.other_deductions),
      0
    );
  }, [corrections]);

  const totalNet = useMemo(() => {
    return corrections.reduce(
      (sum, item) =>
        sum + number(item.net_salary),
      0
    );
  }, [corrections]);

  const formBenefits =
    number(form.overtime) +
    number(form.bonus) +
    number(form.housing_allowance) +
    number(form.food_allowance) +
    number(form.marriage_allowance) +
    number(form.child_allowance) +
    number(form.other_benefits);

  const formDeductions =
    number(form.insurance) +
    number(form.tax) +
    number(form.other_deductions);

  const formNet =
    number(form.base_salary) +
    formBenefits -
    formDeductions;

  function updateForm(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function startEdit(item) {
    setEditingId(item.id);

    setForm({
      year: item.year || "1405",
      month: item.month || "فروردین",

      bank_account:
        item.bank_account || "",

      job_group:
        item.job_group || "",

      job_title:
        item.job_title || "",

      base_salary:
        item.base_salary || "",

      overtime:
        item.overtime || "",

      bonus:
        item.bonus || "",

      housing_allowance:
        item.housing_allowance || "",

      food_allowance:
        item.food_allowance || "",

      marriage_allowance:
        item.marriage_allowance || "",

      child_allowance:
        item.child_allowance || "",

      other_benefits:
        item.other_benefits || "",

      insurance:
        item.insurance || "",

      tax:
        item.tax || "",

      other_deductions:
        item.other_deductions || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSave() {
    if (!editingId) {
      return;
    }

    if (
      number(form.base_salary) <= 0
    ) {
      alert(
        "لطفاً حقوق پایه را وارد کنید."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "/api/corrections",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingId,

            year: form.year,
            month: form.month,

            bank_account:
              form.bank_account,

            job_group:
              form.job_group,

            job_title:
              form.job_title,

            base_salary:
              number(form.base_salary),

            overtime:
              number(form.overtime),

            bonus:
              number(form.bonus),

            housing_allowance:
              number(
                form.housing_allowance
              ),

            food_allowance:
              number(
                form.food_allowance
              ),

            marriage_allowance:
              number(
                form.marriage_allowance
              ),

            child_allowance:
              number(
                form.child_allowance
              ),

            other_benefits:
              number(
                form.other_benefits
              ),

            insurance:
              number(form.insurance),

            tax:
              number(form.tax),

            other_deductions:
              number(
                form.other_deductions
              ),
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "اصلاح فیش انجام نشد."
        );
      }

      alert(
        "فیش با موفقیت اصلاح شد."
      );

      cancelEdit();

      await loadCorrections();
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "خطا در اصلاح فیش"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "آیا از حذف این فیش مطمئن هستید؟\n\nاین عملیات قابل برگشت نیست."
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        "/api/corrections",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "حذف فیش انجام نشد."
        );
      }

      alert(
        "فیش با موفقیت حذف شد."
      );

      await loadCorrections();
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "خطا در حذف فیش"
      );
    }
  }

  function clearFilters() {
    setSearch("");
    setYear("");
    setMonth("");

    setTimeout(() => {
      loadCorrections();
    }, 0);
  }

  function handleSearch(event) {
    event.preventDefault();
    loadCorrections();
  }

  return (
    <div
      className="corrections-page"
      dir="rtl"
    >
      {/* ================= HEADER ================= */}

      <div className="corrections-header">
        <div>
          <div className="title-row">
            <div className="title-icon">
              🛠️
            </div>

            <div>
              <h1>
                اصلاح فیش‌های حقوقی
              </h1>

              <p>
                بررسی، ویرایش و مدیریت فیش‌های
                ثبت‌شده
              </p>
            </div>
          </div>
        </div>

        <div className="system-badge">
          <span>●</span>
          سیستم حقوق و دستمزد
        </div>
      </div>

      {/* ================= STATS ================= */}

      <div className="correction-stats">
        <div className="correction-stat">
          <div className="stat-icon blue">
            📄
          </div>

          <div>
            <span>
              تعداد فیش‌ها
            </span>

            <strong>
              {corrections.length.toLocaleString(
                "fa-IR"
              )}
            </strong>
          </div>
        </div>

        <div className="correction-stat">
          <div className="stat-icon green">
            💰
          </div>

          <div>
            <span>
              مجموع حقوق پایه
            </span>

            <strong>
              {formatMoney(totalBase)}
            </strong>

            <small>
              تومان
            </small>
          </div>
        </div>

        <div className="correction-stat">
          <div className="stat-icon orange">
            🎁
          </div>

          <div>
            <span>
              مجموع مزایا
            </span>

            <strong>
              {formatMoney(
                totalBenefits
              )}
            </strong>

            <small>
              تومان
            </small>
          </div>
        </div>

        <div className="correction-stat">
          <div className="stat-icon red">
            ➖
          </div>

          <div>
            <span>
              مجموع کسورات
            </span>

            <strong>
              {formatMoney(
                totalDeductions
              )}
            </strong>

            <small>
              تومان
            </small>
          </div>
        </div>

        <div className="correction-stat">
          <div className="stat-icon purple">
            💵
          </div>

          <div>
            <span>
              خالص پرداختی
            </span>

            <strong>
              {formatMoney(totalNet)}
            </strong>

            <small>
              تومان
            </small>
          </div>
        </div>
      </div>

      {/* ================= FILTER ================= */}

      <div className="filter-card">
        <div className="filter-header">
          <div>
            <h2>
              🔎 فیلتر و جستجوی فیش
            </h2>

            <p>
              فیش موردنظر را سریع پیدا کنید
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSearch}
          className="filter-grid"
        >
          <div className="filter-group search-group">
            <label>
              جستجو
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="نام، کد ملی یا کد پرسنلی..."
            />
          </div>

          <div className="filter-group">
            <label>
              سال
            </label>

            <select
              value={year}
              onChange={(e) =>
                setYear(e.target.value)
              }
            >
              <option value="">
                همه سال‌ها
              </option>

              <option value="1405">
                1405
              </option>

              <option value="1404">
                1404
              </option>
            </select>
          </div>

          <div className="filter-group">
            <label>
              ماه
            </label>

            <select
              value={month}
              onChange={(e) =>
                setMonth(e.target.value)
              }
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

          <div className="filter-buttons">
            <button
              type="submit"
              className="search-button"
            >
              🔎 جستجو
            </button>

            <button
              type="button"
              onClick={clearFilters}
              className="clear-button"
            >
              ↻ پاک کردن
            </button>
          </div>
        </form>
      </div>

      {/* ================= EDITOR ================= */}

      {editingId !== null && (
        <div className="editor-card">
          <div className="editor-header">
            <div>
              <h2>
                ✏️ اصلاح فیش شماره #{editingId}
              </h2>

              <p>
                اطلاعات فیش را تغییر دهید و
                ذخیره کنید.
              </p>
            </div>

            <button
              type="button"
              onClick={cancelEdit}
              className="close-editor"
            >
              ✕
            </button>
          </div>

          <div className="editor-grid">
            <div className="field">
              <label>
                سال
              </label>

              <input
                value={form.year}
                onChange={(e) =>
                  updateForm(
                    "year",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>
                ماه
              </label>

              <select
                value={form.month}
                onChange={(e) =>
                  updateForm(
                    "month",
                    e.target.value
                  )
                }
              >
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

            <div className="field">
              <label>
                شماره حساب
              </label>

              <input
                value={
                  form.bank_account
                }
                onChange={(e) =>
                  updateForm(
                    "bank_account",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>
                گروه شغلی
              </label>

              <input
                value={
                  form.job_group
                }
                onChange={(e) =>
                  updateForm(
                    "job_group",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>
                عنوان شغلی
              </label>

              <input
                value={
                  form.job_title
                }
                onChange={(e) =>
                  updateForm(
                    "job_title",
                    e.target.value
                  )
                }
              />
            </div>

            <MoneyField
              label="حقوق پایه"
              value={form.base_salary}
              onChange={(value) =>
                updateForm(
                  "base_salary",
                  value
                )
              }
            />

            <MoneyField
              label="اضافه کاری"
              value={form.overtime}
              onChange={(value) =>
                updateForm(
                  "overtime",
                  value
                )
              }
            />

            <MoneyField
              label="پاداش"
              value={form.bonus}
              onChange={(value) =>
                updateForm(
                  "bonus",
                  value
                )
              }
            />

            <MoneyField
              label="حق مسکن"
              value={
                form.housing_allowance
              }
              onChange={(value) =>
                updateForm(
                  "housing_allowance",
                  value
                )
              }
            />

            <MoneyField
              label="بن خواربار"
              value={
                form.food_allowance
              }
              onChange={(value) =>
                updateForm(
                  "food_allowance",
                  value
                )
              }
            />

            <MoneyField
              label="حق تأهل"
              value={
                form.marriage_allowance
              }
              onChange={(value) =>
                updateForm(
                  "marriage_allowance",
                  value
                )
              }
            />

            <MoneyField
              label="حق اولاد"
              value={
                form.child_allowance
              }
              onChange={(value) =>
                updateForm(
                  "child_allowance",
                  value
                )
              }
            />

            <MoneyField
              label="سایر مزایا"
              value={
                form.other_benefits
              }
              onChange={(value) =>
                updateForm(
                  "other_benefits",
                  value
                )
              }
            />

            <MoneyField
              label="حق بیمه"
              value={form.insurance}
              onChange={(value) =>
                updateForm(
                  "insurance",
                  value
                )
              }
              deduction
            />

            <MoneyField
              label="مالیات"
              value={form.tax}
              onChange={(value) =>
                updateForm(
                  "tax",
                  value
                )
              }
              deduction
            />

            <MoneyField
              label="سایر کسورات"
              value={
                form.other_deductions
              }
              onChange={(value) =>
                updateForm(
                  "other_deductions",
                  value
                )
              }
              deduction
            />
          </div>

          {/* محاسبات */}

          <div className="edit-summary">
            <div>
              <span>
                حقوق پایه
              </span>

              <strong>
                {formatMoney(
                  form.base_salary
                )}
              </strong>
            </div>

            <div className="positive">
              <span>
                مجموع مزایا
              </span>

              <strong>
                {formatMoney(
                  formBenefits
                )}
              </strong>
            </div>

            <div className="negative">
              <span>
                مجموع کسورات
              </span>

              <strong>
                {formatMoney(
                  formDeductions
                )}
              </strong>
            </div>

            <div className="net-box">
              <span>
                خالص پرداختی جدید
              </span>

              <strong>
                {formatMoney(formNet)}
              </strong>

              <small>
                تومان
              </small>
            </div>
          </div>

          <div className="editor-actions">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="save-button"
            >
              {saving
                ? "در حال ذخیره..."
                : "✓ ذخیره اصلاحات"}
            </button>

            <button
              type="button"
              onClick={cancelEdit}
              className="cancel-button"
            >
              انصراف
            </button>
          </div>
        </div>
      )}

      {/* ================= TABLE ================= */}

      <div className="table-card">
        <div className="table-header">
          <div>
            <h2>
              📋 فهرست فیش‌ها
            </h2>

            <p>
              فیش‌های ثبت‌شده در سیستم
            </p>
          </div>

          <span className="count-badge">
            {corrections.length.toLocaleString(
              "fa-IR"
            )}{" "}
            فیش
          </span>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>کارمند</th>
                <th>کد پرسنلی</th>
                <th>دوره</th>
                <th>حقوق پایه</th>
                <th>مزایا</th>
                <th>کسورات</th>
                <th>خالص</th>
                <th>عملیات</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    className="empty-cell"
                  >
                    در حال دریافت اطلاعات...
                  </td>
                </tr>
              ) : corrections.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="empty-cell"
                  >
                    فیشی پیدا نشد.
                  </td>
                </tr>
              ) : (
                corrections.map(
                  (item, index) => {
                    const benefits =
                      number(
                        item.overtime
                      ) +
                      number(
                        item.bonus
                      ) +
                      number(
                        item.housing_allowance
                      ) +
                      number(
                        item.food_allowance
                      ) +
                      number(
                        item.marriage_allowance
                      ) +
                      number(
                        item.child_allowance
                      ) +
                      number(
                        item.other_benefits
                      );

                    const deductions =
                      number(
                        item.insurance
                      ) +
                      number(
                        item.tax
                      ) +
                      number(
                        item.other_deductions
                      );

                    return (
                      <tr
                        key={item.id}
                      >
                        <td>
                          {index + 1}
                        </td>

                        <td className="employee-cell">
                          <strong>
                            {item.full_name ||
                              "نامشخص"}
                          </strong>

                          <small>
                            {item.national_id ||
                              "---"}
                          </small>
                        </td>

                        <td>
                          {item.personnel_code ||
                            "---"}
                        </td>

                        <td>
                          {item.month}{" "}
                          {item.year}
                        </td>

                        <td>
                          {formatMoney(
                            item.base_salary
                          )}{" "}
                          تومان
                        </td>

                        <td className="positive-text">
                          {formatMoney(
                            benefits
                          )}{" "}
                          تومان
                        </td>

                        <td className="negative-text">
                          {formatMoney(
                            deductions
                          )}{" "}
                          تومان
                        </td>

                        <td className="net-text">
                          {formatMoney(
                            item.net_salary
                          )}{" "}
                          تومان
                        </td>

                        <td>
                          <div className="action-buttons">
                            <a
                              href={`/admin/payslips/${item.id}`}
                              className="view-button"
                            >
                              👁
                            </a>

                            <button
                              type="button"
                              onClick={() =>
                                startEdit(
                                  item
                                )
                              }
                              className="edit-button"
                            >
                              ✏️
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  item.id
                                )
                              }
                              className="delete-button"
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= FOOTER ================= */}

      <div className="corrections-footer">
        سیستم حقوق و دستمزد — مدیریت اصلاح فیش‌ها
      </div>
    </div>
  );
}


/* =====================================================
   فیلد مبلغ
===================================================== */

function MoneyField({
  label,
  value,
  onChange,
  deduction = false,
}) {
  return (
    <div className="field">
      <label>
        {label}
      </label>

      <div
        className={
          deduction
            ? "money-input deduction"
            : "money-input"
        }
      >
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
        />

        <span>
          تومان
        </span>
      </div>
    </div>
  );
}