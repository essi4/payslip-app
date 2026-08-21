"use client";

import "./payslips.css";
import { useEffect, useState } from "react";

export default function PayslipsPage() {
  const [isMounted, setIsMounted] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [payslips, setPayslips] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const emptyForm = {
    personnel_id: "",
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

  /* =====================================================
     تبدیل عدد
  ===================================================== */

  function number(value) {
    return Number(value) || 0;
  }

  /* =====================================================
     محاسبات
  ===================================================== */

  const base = number(form.base_salary);
  const overtime = number(form.overtime);
  const bonus = number(form.bonus);

  const housing = number(form.housing_allowance);
  const food = number(form.food_allowance);
  const marriage = number(form.marriage_allowance);
  const child = number(form.child_allowance);
  const otherBenefits = number(form.other_benefits);

  const insurance = number(form.insurance);
  const tax = number(form.tax);
  const otherDeductions = number(form.other_deductions);

  const totalBenefits =
    overtime +
    bonus +
    housing +
    food +
    marriage +
    child +
    otherBenefits;

  const totalDeductions =
    insurance +
    tax +
    otherDeductions;

  const netSalary =
    base +
    totalBenefits -
    totalDeductions;

  /* =====================================================
     دریافت اطلاعات
  ===================================================== */

  async function loadData() {
    try {
      setLoading(true);

      const [empRes, payRes] = await Promise.all([
        fetch("/api/personnel", {
          cache: "no-store",
        }),

        fetch("/api/payslips", {
          cache: "no-store",
        }),
      ]);

      const empData = await empRes.json();
      const payData = await payRes.json();

      if (empData.success && Array.isArray(empData.data)) {
        setEmployees(empData.data);
      } else {
        setEmployees([]);
      }

      if (payData.success && Array.isArray(payData.data)) {
        setPayslips(payData.data);
      } else {
        setPayslips([]);
      }
    } catch (error) {
      console.error("خطا در دریافت اطلاعات:", error);

      alert("خطا در دریافت اطلاعات از سرور");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setIsMounted(true);
    loadData();
  }, []);

  /* =====================================================
     تغییر فرم
  ===================================================== */

  function updateForm(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  /* =====================================================
     انتخاب کارمند
     
     با انتخاب کارمند:
     شماره حساب
     گروه شغلی
     عنوان شغلی
     به صورت خودکار پر می‌شوند.
     
     بعد از پر شدن، کاربر می‌تواند آنها را اصلاح کند.
  ===================================================== */

  function handleEmployeeChange(value) {
    if (!value) {
      setForm((previous) => ({
        ...previous,
        personnel_id: "",
        bank_account: "",
        job_group: "",
        job_title: "",
      }));

      return;
    }

    const selectedEmployee = employees.find(
      (employee) =>
        String(employee.id) === String(value)
    );

    if (!selectedEmployee) {
      updateForm("personnel_id", value);
      return;
    }

    setForm((previous) => ({
      ...previous,

      personnel_id: String(selectedEmployee.id),

      bank_account:
        selectedEmployee.bank_account || "",

      job_group:
        selectedEmployee.job_group || "",

      job_title:
        selectedEmployee.job_title || "",
    }));
  }

  /* =====================================================
     ثبت / ویرایش
  ===================================================== */

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.personnel_id) {
      alert("لطفاً یک کارمند را انتخاب کنید.");
      return;
    }

    if (!form.base_salary || base <= 0) {
      alert("لطفاً حقوق پایه را وارد کنید.");
      return;
    }

    try {
      setSaving(true);

      const isEditing = editingId !== null;

      const response = await fetch("/api/payslips", {
        method: isEditing ? "PUT" : "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...(isEditing ? { id: editingId } : {}),

          personnel_id: Number(form.personnel_id),

          year: form.year,
          month: form.month,

          bank_account: form.bank_account,
          job_group: form.job_group,
          job_title: form.job_title,

          base_salary: base,
          overtime,
          bonus,

          housing_allowance: housing,
          food_allowance: food,
          marriage_allowance: marriage,
          child_allowance: child,
          other_benefits: otherBenefits,

          insurance,
          tax,
          other_deductions: otherDeductions,

          net_salary: netSalary,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(
          result.error ||
            result.message ||
            "عملیات انجام نشد"
        );

        return;
      }

      alert(
        isEditing
          ? "فیش حقوقی با موفقیت ویرایش شد."
          : "فیش حقوقی با موفقیت صادر شد."
      );

      resetForm();

      await loadData();
    } catch (error) {
      console.error("خطا:", error);

      alert("خطا در اتصال به سرور");
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     ویرایش فیش
  ===================================================== */

  function handleEdit(payslip) {
    setEditingId(payslip.id);

    setForm({
      personnel_id: String(
        payslip.personnel_id || ""
      ),

      year: payslip.year || "1405",

      month:
        payslip.month || "فروردین",

      bank_account:
        payslip.bank_account || "",

      job_group:
        payslip.job_group || "",

      job_title:
        payslip.job_title || "",

      base_salary:
        payslip.base_salary || "",

      overtime:
        payslip.overtime || "",

      bonus:
        payslip.bonus || "",

      housing_allowance:
        payslip.housing_allowance || "",

      food_allowance:
        payslip.food_allowance || "",

      marriage_allowance:
        payslip.marriage_allowance || "",

      child_allowance:
        payslip.child_allowance || "",

      other_benefits:
        payslip.other_benefits || "",

      insurance:
        payslip.insurance || "",

      tax:
        payslip.tax || "",

      other_deductions:
        payslip.other_deductions || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =====================================================
     حذف فیش
  ===================================================== */

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "آیا از حذف این فیش حقوقی مطمئن هستید؟\n\nاین عملیات قابل بازگشت نیست."
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch("/api/payslips", {
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
        alert(
          result.error ||
            result.message ||
            "حذف فیش انجام نشد"
        );

        return;
      }

      alert("فیش حقوقی با موفقیت حذف شد.");

      if (editingId === id) {
        resetForm();
      }

      await loadData();
    } catch (error) {
      console.error("خطا در حذف:", error);

      alert("خطا در اتصال به سرور");
    }
  }

  /* =====================================================
     لغو ویرایش
  ===================================================== */

  function resetForm() {
    setForm({
      ...emptyForm,
    });

    setEditingId(null);
  }

  /* =====================================================
     نمایش صفحه
  ===================================================== */

  if (!isMounted) {
    return null;
  }

  return (
    <div
      className="payslips-page"
      dir="rtl"
    >

      {/* Header */}

      <div className="payslips-header">

        <div className="page-title-row">

          <div className="title-icon">
            💰
          </div>

          <div>
            <h1>
              مدیریت فیش حقوقی
            </h1>

            <p>
              ثبت، صدور و مشاهده فیش حقوق کارکنان
            </p>
          </div>

        </div>

        <div className="header-badge">
          <span>●</span>
          سیستم حقوق و دستمزد
        </div>

      </div>


      {/* Statistics */}

      <div className="stats-grid">

        <div className="stat-card">

          <div className="stat-icon blue">
            📄
          </div>

          <div>
            <span>
              کل فیش‌ها
            </span>

            <strong>
              {payslips.length.toLocaleString(
                "fa-IR"
              )}
            </strong>
          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon green">
            👥
          </div>

          <div>
            <span>
              کارکنان
            </span>

            <strong>
              {employees.length.toLocaleString(
                "fa-IR"
              )}
            </strong>
          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon orange">
            💵
          </div>

          <div>

            <span>
              مجموع خالص پرداختی
            </span>

            <strong>
              {payslips
                .reduce(
                  (sum, item) =>
                    sum +
                    number(
                      item.net_salary
                    ),
                  0
                )
                .toLocaleString(
                  "fa-IR"
                )}
            </strong>

            <small>
              تومان
            </small>

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon purple">
            📅
          </div>

          <div>

            <span>
              دوره جاری
            </span>

            <strong>
              {form.year}
            </strong>

            <small>
              {form.month}
            </small>

          </div>

        </div>

      </div>


      {/* Form */}

      <div className="form-card">

        <div className="section-header">

          <div>

            <h2>
              {editingId !== null
                ? "ویرایش فیش حقوقی"
                : "صدور فیش جدید"}
            </h2>

            <p>
              {editingId !== null
                ? "اطلاعات فیش را اصلاح کنید"
                : "اطلاعات حقوق و کسورات کارمند را وارد کنید"}
            </p>

          </div>

          <div className="section-icon">
            {editingId !== null
              ? "✏️"
              : "➕"}
          </div>

        </div>


        <form
          onSubmit={handleSubmit}
        >

          <div className="form-grid">

            {/* انتخاب کارمند */}

            <div className="form-group employee-field">

              <label>
                انتخاب کارمند
              </label>

              <select
                value={form.personnel_id}
                onChange={(e) =>
                  handleEmployeeChange(
                    e.target.value
                  )
                }
              >

                <option value="">
                  انتخاب کارمند...
                </option>

                {employees.map(
                  (employee) => (

                    <option
                      key={employee.id}
                      value={employee.id}
                    >

                      {employee.full_name ||
                        "بدون نام"}

                      {" — "}

                      {employee.personnel_code ||
                        "بدون کد"}

                    </option>

                  )
                )}

              </select>

            </div>


            {/* سال */}

            <div className="form-group">

              <label>
                سال
              </label>

              <input
                type="text"
                value={form.year}
                onChange={(e) =>
                  updateForm(
                    "year",
                    e.target.value
                  )
                }
              />

            </div>


            {/* ماه */}

            <div className="form-group">

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

                {[
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
                ].map(
                  (month) => (

                    <option
                      key={month}
                      value={month}
                    >
                      {month}
                    </option>

                  )
                )}

              </select>

            </div>


            {/* شماره حساب */}

            <div className="form-group">

              <label>
                شماره حساب
              </label>

              <input
                type="text"
                value={form.bank_account}
                onChange={(e) =>
                  updateForm(
                    "bank_account",
                    e.target.value
                  )
                }
                placeholder="شماره حساب"
              />

            </div>


            {/* گروه شغلی */}

            <div className="form-group">

              <label>
                گروه شغلی
              </label>

              <input
                type="text"
                value={form.job_group}
                onChange={(e) =>
                  updateForm(
                    "job_group",
                    e.target.value
                  )
                }
                placeholder="مثلاً گروه ۸"
              />

            </div>


            {/* عنوان شغلی */}

            <div className="form-group">

              <label>
                عنوان شغلی
              </label>

              <input
                type="text"
                value={form.job_title}
                onChange={(e) =>
                  updateForm(
                    "job_title",
                    e.target.value
                  )
                }
                placeholder="عنوان شغلی"
              />

            </div>


            {/* حقوق پایه */}

            <MoneyInput
              label="حقوق پایه"
              value={form.base_salary}
              onChange={(value) =>
                updateForm(
                  "base_salary",
                  value
                )
              }
            />


            {/* اضافه کاری */}

            <MoneyInput
              label="اضافه کاری"
              value={form.overtime}
              onChange={(value) =>
                updateForm(
                  "overtime",
                  value
                )
              }
            />


            {/* پاداش */}

            <MoneyInput
              label="پاداش"
              value={form.bonus}
              onChange={(value) =>
                updateForm(
                  "bonus",
                  value
                )
              }
            />


            {/* حق مسکن */}

            <MoneyInput
              label="حق مسکن"
              value={form.housing_allowance}
              onChange={(value) =>
                updateForm(
                  "housing_allowance",
                  value
                )
              }
            />


            {/* بن */}

            <MoneyInput
              label="بن خواربار"
              value={form.food_allowance}
              onChange={(value) =>
                updateForm(
                  "food_allowance",
                  value
                )
              }
            />


            {/* تأهل */}

            <MoneyInput
              label="حق تأهل"
              value={form.marriage_allowance}
              onChange={(value) =>
                updateForm(
                  "marriage_allowance",
                  value
                )
              }
            />


            {/* اولاد */}

            <MoneyInput
              label="حق اولاد"
              value={form.child_allowance}
              onChange={(value) =>
                updateForm(
                  "child_allowance",
                  value
                )
              }
            />


            {/* سایر مزایا */}

            <MoneyInput
              label="سایر مزایا"
              value={form.other_benefits}
              onChange={(value) =>
                updateForm(
                  "other_benefits",
                  value
                )
              }
            />


            {/* بیمه */}

            <MoneyInput
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


            {/* مالیات */}

            <MoneyInput
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


            {/* سایر کسورات */}

            <MoneyInput
              label="سایر کسورات"
              value={form.other_deductions}
              onChange={(value) =>
                updateForm(
                  "other_deductions",
                  value
                )
              }
              deduction
            />

          </div>


          {/* خلاصه حقوق */}

          <div className="salary-summary">

            <div className="summary-item">

              <span>
                حقوق پایه
              </span>

              <strong>
                {base.toLocaleString(
                  "fa-IR"
                )}{" "}
                تومان
              </strong>

            </div>


            <div className="summary-item">

              <span>
                مجموع مزایا
              </span>

              <strong className="positive">
                {totalBenefits.toLocaleString(
                  "fa-IR"
                )}{" "}
                تومان
              </strong>

            </div>


            <div className="summary-item">

              <span>
                مجموع کسورات
              </span>

              <strong className="negative">
                {totalDeductions.toLocaleString(
                  "fa-IR"
                )}{" "}
                تومان
              </strong>

            </div>


            <div className="net-summary">

              <span>
                خالص پرداختی
              </span>

              <strong>
                {netSalary.toLocaleString(
                  "fa-IR"
                )}
              </strong>

              <small>
                تومان
              </small>

            </div>

          </div>


          {/* دکمه‌ها */}

          <div className="form-actions">

            <button
              type="submit"
              disabled={saving}
              className="submit-button"
            >

              {saving
                ? "در حال ذخیره..."
                : editingId !== null
                ? "✓ ذخیره تغییرات"
                : "✓ ثبت و صدور فیش حقوقی"}

            </button>


            {editingId !== null && (

              <button
                type="button"
                onClick={resetForm}
                className="back-button"
              >
                لغو ویرایش
              </button>

            )}

          </div>

        </form>

      </div>


      {/* جدول فیش‌ها */}

      <div className="table-card">

        <div className="section-header table-header">

          <div>

            <h2>
              فیش‌های صادر شده
            </h2>

            <p>
              لیست آخرین فیش‌های ثبت شده در سیستم
            </p>

          </div>

          <span className="count-badge">

            {payslips.length.toLocaleString(
              "fa-IR"
            )}{" "}
            فیش

          </span>

        </div>


        <div className="table-wrapper">

          <table>

            <thead>

              <tr>

                <th>
                  #
                </th>

                <th>
                  کارمند
                </th>

                <th>
                  کد پرسنلی
                </th>

                <th>
                  دوره
                </th>

                <th>
                  حقوق پایه
                </th>

                <th>
                  خالص پرداختی
                </th>

                <th>
                  وضعیت
                </th>

                <th>
                  عملیات
                </th>

              </tr>

            </thead>


            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan="8"
                    className="empty-cell"
                  >
                    در حال دریافت اطلاعات...
                  </td>

                </tr>

              ) : payslips.length === 0 ? (

                <tr>

                  <td
                    colSpan="8"
                    className="empty-cell"
                  >
                    هنوز فیشی صادر نشده است.
                  </td>

                </tr>

              ) : (

                payslips.map(
                  (payslip, index) => (

                    <tr
                      key={payslip.id}
                    >

                      <td>
                        {index + 1}
                      </td>


                      <td className="employee-name">

                        {payslip.full_name ||
                          "نامشخص"}

                      </td>


                      <td>

                        {payslip.personnel_code ||
                          "---"}

                      </td>


                      <td>

                        {payslip.month}{" "}
                        {payslip.year}

                      </td>


                      <td>

                        {number(
                          payslip.base_salary
                        ).toLocaleString(
                          "fa-IR"
                        )}{" "}
                        تومان

                      </td>


                      <td className="net-value">

                        {number(
                          payslip.net_salary
                        ).toLocaleString(
                          "fa-IR"
                        )}{" "}
                        تومان

                      </td>


                      <td>

                        <span className="status-badge">
                          صادر شده
                        </span>

                      </td>


                      <td>

                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >

                          <a
                            href={`/admin/payslips/${payslip.id}`}
                            className="view-button"
                          >
                            👁 مشاهده
                          </a>


                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                payslip
                              )
                            }
                            style={{
                              border: "none",
                              cursor: "pointer",
                              padding:
                                "8px 12px",
                              borderRadius:
                                "8px",
                              background:
                                "#f59e0b",
                              color:
                                "#ffffff",
                            }}
                          >
                            ✏️ ویرایش
                          </button>


                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                payslip.id
                              )
                            }
                            style={{
                              border: "none",
                              cursor: "pointer",
                              padding:
                                "8px 12px",
                              borderRadius:
                                "8px",
                              background:
                                "#ef4444",
                              color:
                                "#ffffff",
                            }}
                          >
                            🗑 حذف
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   کامپوننت ورودی مبلغ
========================================================= */

function MoneyInput({
  label,
  value,
  onChange,
  deduction = false,
}) {
  return (
    <div className="form-group">

      <label>
        {label}
      </label>

      <div
        className={`input-with-label ${
          deduction
            ? "deduction"
            : ""
        }`}
      >

        <input
          type="number"
          min="0"
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder="0"
        />

        <span>
          تومان
        </span>

      </div>

    </div>
  );
}