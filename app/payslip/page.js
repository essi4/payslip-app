"use client";

import { useState } from "react";

function money(value) {
  const number = Number(value || 0);
  return number.toLocaleString("fa-IR") + " تومان";
}

function valueOrDash(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}

function Cell({ label, value }) {
  return (
    <div className="border-b border-slate-200 bg-white px-3 py-2.5">
      <div className="mb-1 text-[10px] font-bold text-slate-500">
        {label}
      </div>

      <div className="truncate text-xs font-black text-slate-900">
        {valueOrDash(value)}
      </div>
    </div>
  );
}

function MoneyRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
      <span className="text-xs font-bold text-slate-700">
        {label}
      </span>

      <span className="text-xs font-black text-slate-900">
        {money(value)}
      </span>
    </div>
  );
}

function PayslipDocument({ payslip, onBack, onPrint }) {
  const totalBenefits =
    Number(payslip.housing_allowance || 0) +
    Number(payslip.food_allowance || 0) +
    Number(payslip.marriage_allowance || 0) +
    Number(payslip.child_allowance || 0) +
    Number(payslip.other_benefits || 0);

  const totalIncome =
    Number(payslip.base_salary || 0) +
    Number(payslip.overtime || 0) +
    Number(payslip.bonus || 0) +
    totalBenefits;

  const totalDeductions =
    Number(payslip.insurance || 0) +
    Number(payslip.tax || 0) +
    Number(payslip.other_deductions || 0);

  return (
    <article
      id={"payslip-" + payslip.id}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
    >
      {/* Header */}
      <div className="bg-gradient-to-l from-slate-950 via-blue-950 to-slate-900 px-4 py-4 text-white md:px-6">
        <div className="grid gap-3 md:grid-cols-3 md:items-center">
          <div className="text-center md:text-right">
            <div className="text-[10px] text-blue-200">
              دوره حقوق
            </div>

            <div className="mt-1 text-sm font-black">
              {valueOrDash(payslip.month)}{" "}
              {valueOrDash(payslip.year)}
            </div>
          </div>

          <div className="text-center">
            <div className="text-lg font-black md:text-xl">
              سیستم حقوق و دستمزد چابکان
            </div>

            <div className="mt-1 text-[11px] font-bold text-blue-200">
              فیش حقوق و دستمزد
            </div>
          </div>

          <div className="text-center md:text-left">
            <div className="text-[10px] text-blue-200">
              شماره فیش
            </div>

            <div className="mt-1 text-sm font-black">
              {payslip.id
                ? Number(payslip.id).toLocaleString("fa-IR")
                : "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 md:p-5">
        {/* Employee */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-sm">
              👤
            </div>

            <div>
              <h2 className="text-sm font-black text-slate-950">
                مشخصات پرسنل
              </h2>

              <p className="text-[10px] text-slate-500">
                اطلاعات شناسایی و شغلی
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 md:grid-cols-3">
            <Cell
              label="نام و نام خانوادگی"
              value={payslip.full_name}
            />

            <Cell
              label="کد ملی"
              value={payslip.national_id}
            />

            <Cell
              label="شماره پرسنلی"
              value={payslip.personnel_code}
            />

            <Cell
              label="عنوان شغلی"
              value={
                payslip.job_title ||
                payslip.employee_job_title
              }
            />

            <Cell
              label="گروه شغلی"
              value={payslip.job_group}
            />

            <Cell
              label="واحد سازمانی"
              value={payslip.department}
            />

            <Cell
              label="شماره حساب / شبا"
              value={payslip.bank_account}
            />

            <Cell
              label="دوره حقوق"
              value={
                valueOrDash(payslip.month) +
                " " +
                valueOrDash(payslip.year)
              }
            />

            <Cell
              label="وضعیت"
              value="رسمی"
            />
          </div>
        </section>

        {/* Work information */}
        <section className="mt-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-sm">
              🕐
            </div>

            <div>
              <h2 className="text-sm font-black text-slate-950">
                اطلاعات کارکرد
              </h2>

              <p className="text-[10px] text-slate-500">
                وضعیت کارکرد دوره حقوق
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 md:grid-cols-6">
            <Cell label="روزهای کارکرد" value="31 روز" />
            <Cell label="ساعات کارکرد" value="220 ساعت" />
            <Cell label="اضافه‌کاری" value="—" />
            <Cell label="مرخصی استحقاقی" value="—" />
            <Cell label="غیبت" value="0 روز" />
            <Cell label="ماموریت" value="0 روز" />
          </div>
        </section>

        {/* Financial */}
        <section className="mt-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-sm">
              💰
            </div>

            <div>
              <h2 className="text-sm font-black text-slate-950">
                جزئیات مالی فیش
              </h2>

              <p className="text-[10px] text-slate-500">
                مزایا، دریافت‌ها و کسورات
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {/* Benefits */}
            <div className="overflow-hidden rounded-xl border border-emerald-200">
              <div className="bg-emerald-700 px-3 py-2.5 text-center text-xs font-black text-white">
                مزایا و دریافت‌ها
              </div>

              <MoneyRow
                label="حقوق پایه"
                value={payslip.base_salary}
              />

              <MoneyRow
                label="اضافه‌کاری"
                value={payslip.overtime}
              />

              <MoneyRow
                label="پاداش"
                value={payslip.bonus}
              />

              <MoneyRow
                label="حق مسکن"
                value={payslip.housing_allowance}
              />

              <MoneyRow
                label="بن خواربار"
                value={payslip.food_allowance}
              />

              <MoneyRow
                label="حق تأهل"
                value={payslip.marriage_allowance}
              />

              <MoneyRow
                label="حق اولاد"
                value={payslip.child_allowance}
              />

              <MoneyRow
                label="سایر مزایا"
                value={payslip.other_benefits}
              />

              <div className="flex items-center justify-between bg-emerald-50 px-3 py-2.5">
                <span className="text-xs font-black text-emerald-800">
                  جمع کل دریافت‌ها
                </span>

                <span className="text-xs font-black text-emerald-800">
                  {money(totalIncome)}
                </span>
              </div>
            </div>

            {/* Deductions */}
            <div className="overflow-hidden rounded-xl border border-red-200">
              <div className="bg-red-700 px-3 py-2.5 text-center text-xs font-black text-white">
                کسورات قانونی
              </div>

              <MoneyRow
                label="بیمه تأمین اجتماعی"
                value={payslip.insurance}
              />

              <MoneyRow
                label="مالیات بر درآمد"
                value={payslip.tax}
              />

              <MoneyRow
                label="سایر کسورات"
                value={payslip.other_deductions}
              />

              <div className="min-h-[232px] bg-white" />

              <div className="flex items-center justify-between bg-red-50 px-3 py-2.5">
                <span className="text-xs font-black text-red-800">
                  جمع کل کسورات
                </span>

                <span className="text-xs font-black text-red-800">
                  {money(totalDeductions)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Net salary */}
        <section className="mt-5 overflow-hidden rounded-2xl bg-gradient-to-l from-blue-950 to-slate-900 p-4 text-white shadow-lg">
          <div className="grid gap-3 md:grid-cols-2 md:items-center">
            <div className="text-center md:text-right">
              <div className="text-xs font-bold text-blue-200">
                مبلغ نهایی قابل پرداخت به کارمند
              </div>

              <div className="mt-1 text-[10px] text-slate-300">
                خالص حقوق پس از کسر کسورات قانونی
              </div>
            </div>

            <div className="text-center">
              <div className="text-xs font-bold text-blue-200">
                خالص پرداختی
              </div>

              <div className="mt-1 text-2xl font-black md:text-3xl">
                {money(payslip.net_salary)}
              </div>
            </div>
          </div>
        </section>

        {/* Signatures */}
        <div className="mt-7 grid gap-6 text-center md:grid-cols-2">
          <div>
            <div className="text-xs font-black text-slate-700">
              امضاء دریافت‌کننده / کارمند
            </div>

            <div className="mt-8 text-xs text-slate-400">
              ..............................
            </div>
          </div>

          <div>
            <div className="text-xs font-black text-slate-700">
              مهر و امضاء مدیر امور مالی
            </div>

            <div className="mt-8 text-xs text-slate-400">
              ..............................
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-4 text-center text-[10px] text-slate-500">
          این فیش به صورت الکترونیکی از سامانه حقوق و دستمزد چابکان صادر شده است.
        </div>

        {/* Buttons */}
        <div className="no-print mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-100"
          >
            ← بازگشت به ماه‌ها
          </button>

          <button
            type="button"
            onClick={() => onPrint(payslip.id)}
            className="rounded-xl bg-blue-700 px-6 py-2 text-xs font-black text-white shadow transition hover:bg-blue-800"
          >
            🖨 چاپ همین فیش
          </button>
        </div>
      </div>
    </article>
  );
}

export default function PayslipPage() {
  const [mode, setMode] = useState("login");

  const [nationalId, setNationalId] = useState("");
  const [password, setPassword] = useState("");

  const [personnelCode, setPersonnelCode] = useState("");

  const [recoveryCode, setRecoveryCode] = useState("");
  const [serverRecoveryCode, setServerRecoveryCode] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [employee, setEmployee] = useState(null);
  const [months, setMonths] = useState([]);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
    ============================
    ورود کارمند
    ============================
  */

  async function login() {
    setError("");
    setSuccess("");
    setLoading(true);

    setEmployee(null);
    setMonths([]);
    setSelectedPayslip(null);

    const cleanId = nationalId.replace(/[^0-9]/g, "");

    if (cleanId.length !== 10) {
      setError("کد ملی باید ۱۰ رقمی باشد.");
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError("رمز عبور را وارد کنید.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "/api/payslip?national_id=" +
          encodeURIComponent(cleanId) +
          "&password=" +
          encodeURIComponent(password),
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.error ||
            "کد ملی یا رمز عبور اشتباه است."
        );
        return;
      }

      setEmployee(result.employee);
      setMonths(result.months || []);

      if (!result.months || result.months.length === 0) {
        setError(
          "برای این پرسنل هنوز فیشی ثبت نشده است."
        );
      }
    } catch (error) {
      console.error(error);
      setError("خطا در اتصال به سرور.");
    } finally {
      setLoading(false);
    }
  }

  /*
    ============================
    درخواست بازیابی رمز
    ============================
  */

  async function requestRecovery() {
    setError("");
    setSuccess("");
    setServerRecoveryCode("");
    setLoading(true);

    const cleanId = nationalId.replace(/[^0-9]/g, "");
    const cleanPersonnelCode = personnelCode.trim();

    if (cleanId.length !== 10) {
      setError("کد ملی باید ۱۰ رقمی باشد.");
      setLoading(false);
      return;
    }

    if (!cleanPersonnelCode) {
      setError("کد پرسنلی را وارد کنید.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "/api/payslip/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            national_id: cleanId,
            personnel_code: cleanPersonnelCode,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.error ||
            "اطلاعات واردشده صحیح نیست."
        );
        return;
      }

      /*
        فعلاً بدون SMS:
        API برای تست کد بازیابی را برمی‌گرداند.
      */

      if (result.recovery_code) {
        setServerRecoveryCode(
          String(result.recovery_code)
        );
      }

      setSuccess(
        result.message ||
          "کد بازیابی ایجاد شد."
      );

      setMode("verify");
    } catch (error) {
      console.error(error);
      setError("خطا در ارتباط با سرور.");
    } finally {
      setLoading(false);
    }
  }

  /*
    ============================
    تغییر رمز عبور
    ============================
  */

  async function resetPassword() {
    setError("");
    setSuccess("");
    setLoading(true);

    if (!recoveryCode.trim()) {
      setError("کد بازیابی را وارد کنید.");
      setLoading(false);
      return;
    }

    if (!newPassword.trim()) {
      setError("رمز عبور جدید را وارد کنید.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 4) {
      setError(
        "رمز عبور جدید باید حداقل ۴ کاراکتر باشد."
      );
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "رمز عبور جدید و تکرار آن یکسان نیست."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "/api/payslip/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            national_id: nationalId.replace(
              /[^0-9]/g,
              ""
            ),
            personnel_code:
              personnelCode.trim(),
            recovery_code:
              recoveryCode.trim(),
            new_password: newPassword,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.error ||
            "تغییر رمز عبور انجام نشد."
        );
        return;
      }

      setSuccess(
        result.message ||
          "رمز عبور با موفقیت تغییر کرد."
      );

      setPassword("");
      setRecoveryCode("");
      setNewPassword("");
      setConfirmPassword("");
      setServerRecoveryCode("");

      setTimeout(() => {
        setMode("login");
        setSuccess("");
      }, 1500);
    } catch (error) {
      console.error(error);
      setError("خطا در تغییر رمز عبور.");
    } finally {
      setLoading(false);
    }
  }

  /*
    ============================
    مشاهده فیش
    ============================
  */

  async function openPayslip(month, year) {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(
        "/api/payslip?national_id=" +
          encodeURIComponent(nationalId) +
          "&password=" +
          encodeURIComponent(password) +
          "&month=" +
          encodeURIComponent(month) +
          "&year=" +
          encodeURIComponent(year),
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.error ||
            "فیش موردنظر پیدا نشد."
        );
        return;
      }

      if (
        result.data &&
        result.data.length > 0
      ) {
        setSelectedPayslip(
          result.data[0]
        );
      } else {
        setError(
          "فیش موردنظر پیدا نشد."
        );
      }
    } catch (error) {
      console.error(error);
      setError("خطا در دریافت فیش.");
    } finally {
      setLoading(false);
    }
  }

  /*
    ============================
    خروج
    ============================
  */

  function logout() {
    setNationalId("");
    setPassword("");
    setPersonnelCode("");

    setRecoveryCode("");
    setServerRecoveryCode("");

    setNewPassword("");
    setConfirmPassword("");

    setEmployee(null);
    setMonths([]);
    setSelectedPayslip(null);

    setError("");
    setSuccess("");

    setMode("login");
  }

  /*
    ============================
    چاپ فیش
    ============================
  */

  function printPayslip(id) {
    const element = document.getElementById(
      "payslip-" + id
    );

    if (!element) {
      return;
    }

    const printWindow = window.open(
      "",
      "_blank",
      "width=1000,height=900"
    );

    if (!printWindow) {
      alert(
        "لطفاً اجازه باز شدن پنجره چاپ را در مرورگر فعال کنید."
      );
      return;
    }

    const html = element.outerHTML;

    printWindow.document.open();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>فیش حقوقی</title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 10px;
              background: #fff;
              color: #111827;
              font-family: Tahoma, Arial, sans-serif;
              direction: rtl;
              font-size: 11px;
            }

            .no-print {
              display: none !important;
            }

            @page {
              size: A4;
              margin: 8mm;
            }

            @media print {
              body {
                padding: 0;
              }

              article {
                box-shadow: none !important;
                border-radius: 0 !important;
              }
            }
          </style>
        </head>

        <body>
          ${html}

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  /*
    ============================
    صفحه
    ============================
  */

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 px-2 py-4 md:px-4"
    >
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <header className="mb-4 overflow-hidden rounded-2xl bg-gradient-to-l from-slate-950 via-blue-950 to-slate-900 px-4 py-5 text-white shadow-lg">
          <div className="flex flex-col items-center justify-center gap-1 text-center">

            <div className="text-[10px] font-bold text-blue-300">
              سیستم حقوق و دستمزد
            </div>

            <h1 className="text-xl font-black md:text-2xl">
              چابکان
            </h1>

            <p className="text-[11px] text-slate-300">
              سامانه مشاهده فیش حقوقی کارکنان
            </p>

          </div>
        </header>

        {/* ================= LOGIN ================= */}

        {!employee && mode === "login" && (
          <section className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">

            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 text-center">

              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xl">
                🔒
              </div>

              <h2 className="mt-2 text-lg font-black text-slate-950">
                ورود کارکنان
              </h2>

              <p className="mt-1 text-[11px] text-slate-500">
                برای مشاهده فیش حقوقی، کد ملی و رمز عبور خود را وارد کنید.
              </p>

            </div>

            <div className="space-y-3.5 p-5">

              <div>
                <label className="mb-1.5 block text-xs font-black text-slate-700">
                  کد ملی
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={nationalId}
                  onChange={(event) => {
                    setNationalId(
                      event.target.value.replace(
                        /[^0-9]/g,
                        ""
                      )
                    );
                    setError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      login();
                    }
                  }}
                  placeholder="کد ملی ۱۰ رقمی"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-center text-sm font-black text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black text-slate-700">
                  رمز عبور
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      login();
                    }
                  }}
                  placeholder="رمز عبور"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-center text-sm font-black text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-3 py-2.5 text-center text-xs font-bold text-red-700">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={login}
                disabled={loading}
                className="w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-black text-white shadow transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "در حال بررسی..."
                  : "🔐 ورود به سامانه"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setError("");
                  setSuccess("");
                }}
                className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-black text-blue-700 transition hover:bg-blue-100"
              >
                🔑 فراموشی رمز عبور
              </button>

            </div>
          </section>
        )}

        {/* ================= FORGOT PASSWORD ================= */}

        {!employee && mode === "forgot" && (
          <section className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">

            <div className="border-b border-slate-200 bg-slate-50 px-5 py-5 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-xl">
                🔑
              </div>

              <h2 className="mt-2 text-lg font-black text-slate-950">
                فراموشی رمز عبور
              </h2>

              <p className="mt-1 text-[11px] leading-6 text-slate-500">
                برای بازیابی رمز، کد ملی و کد پرسنلی خود را وارد کنید.
              </p>

            </div>

            <div className="space-y-4 p-5">

              <div>
                <label className="mb-1.5 block text-xs font-black text-slate-700">
                  کد ملی
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={nationalId}
                  onChange={(event) => {
                    setNationalId(
                      event.target.value.replace(
                        /[^0-9]/g,
                        ""
                      )
                    );
                    setError("");
                  }}
                  placeholder="کد ملی ۱۰ رقمی"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-center text-sm font-black outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black text-slate-700">
                  کد پرسنلی
                </label>

                <input
                  type="text"
                  value={personnelCode}
                  onChange={(event) => {
                    setPersonnelCode(
                      event.target.value
                    );
                    setError("");
                  }}
                  placeholder="کد پرسنلی"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-center text-sm font-black outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-3 py-2.5 text-center text-xs font-bold text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-center text-xs font-bold text-emerald-700">
                  {success}
                </div>
              )}

              <button
                type="button"
                onClick={requestRecovery}
                disabled={loading}
                className="w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-black text-white shadow transition hover:bg-blue-800 disabled:opacity-50"
              >
                {loading
                  ? "در حال بررسی..."
                  : "🔐 ایجاد کد بازیابی"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setSuccess("");
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-100"
              >
                ← بازگشت به ورود
              </button>

            </div>
          </section>
        )}

        {/* ================= VERIFY / RESET ================= */}

        {!employee && mode === "verify" && (
          <section className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">

            <div className="border-b border-slate-200 bg-slate-50 px-5 py-5 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-xl">
                🔐
              </div>

              <h2 className="mt-2 text-lg font-black text-slate-950">
                بازیابی رمز عبور
              </h2>

              <p className="mt-1 text-[11px] leading-6 text-slate-500">
                کد بازیابی را وارد کنید و رمز جدید خود را تعیین کنید.
              </p>

            </div>

            <div className="space-y-4 p-5">

              {/* Test code */}
              {serverRecoveryCode && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">

                  <div className="text-[10px] font-bold text-amber-700">
                    کد بازیابی آزمایشی
                  </div>

                  <div className="mt-2 text-2xl font-black tracking-[0.35em] text-amber-900">
                    {serverRecoveryCode}
                  </div>

                  <div className="mt-2 text-[10px] leading-5 text-amber-700">
                    این بخش فعلاً برای تست بدون SMS نمایش داده می‌شود.
                    بعداً همین کد از طریق پیامک ارسال خواهد شد.
                  </div>

                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-black text-slate-700">
                  کد بازیابی
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={recoveryCode}
                  onChange={(event) => {
                    setRecoveryCode(
                      event.target.value.replace(
                        /[^0-9]/g,
                        ""
                      )
                    );
                    setError("");
                  }}
                  placeholder="کد ۶ رقمی"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-center text-lg font-black tracking-[0.3em] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black text-slate-700">
                  رمز عبور جدید
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(
                      event.target.value
                    );
                    setError("");
                  }}
                  placeholder="حداقل ۴ کاراکتر"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-center text-sm font-black outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black text-slate-700">
                  تکرار رمز عبور جدید
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(
                      event.target.value
                    );
                    setError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      resetPassword();
                    }
                  }}
                  placeholder="تکرار رمز عبور"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-center text-sm font-black outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-3 py-2.5 text-center text-xs font-bold text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-center text-xs font-bold text-emerald-700">
                  {success}
                </div>
              )}

              <button
                type="button"
                onClick={resetPassword}
                disabled={loading}
                className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow transition hover:bg-emerald-800 disabled:opacity-50"
              >
                {loading
                  ? "در حال تغییر رمز..."
                  : "✅ تغییر رمز عبور"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setSuccess("");
                  setServerRecoveryCode("");
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-100"
              >
                ← بازگشت به ورود
              </button>

            </div>
          </section>
        )}

        {/* ================= EMPLOYEE + MONTHS ================= */}

        {employee && !selectedPayslip && (
          <>
            <section className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">

              <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">

                <div className="min-w-0">

                  <div className="text-[10px] font-bold text-slate-500">
                    کارمند وارد شده
                  </div>

                  <h2 className="mt-0.5 truncate text-base font-black text-slate-950">
                    {employee.full_name}
                  </h2>

                  <div className="mt-1 text-[11px] text-slate-500">
                    کد پرسنلی:{" "}
                    <span className="font-black text-slate-800">
                      {employee.personnel_code || "—"}
                    </span>
                  </div>

                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="self-start rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-700 transition hover:bg-red-100 md:self-center"
                >
                  خروج
                </button>

              </div>
            </section>

            <section>

              <div className="mb-3 flex items-center justify-between">

                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    فیش‌های حقوقی
                  </h2>

                  <p className="mt-0.5 text-[10px] text-slate-500">
                    دوره موردنظر را انتخاب کنید
                  </p>
                </div>

                <div className="rounded-lg bg-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                  {months.length.toLocaleString("fa-IR")} فیش
                </div>

              </div>

              {error && (
                <div className="mb-3 rounded-xl bg-red-50 px-3 py-2.5 text-center text-xs font-bold text-red-700">
                  {error}
                </div>
              )}

              {/* Desktop */}
              <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md md:block">

                <div className="grid grid-cols-[1fr_1fr_2fr_1fr] items-center bg-slate-100 px-4 py-2.5 text-[11px] font-black text-slate-600">

                  <div>دوره حقوق</div>
                  <div>سال</div>
                  <div>خالص پرداختی</div>
                  <div className="text-center">
                    عملیات
                  </div>

                </div>

                {months.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="grid grid-cols-[1fr_1fr_2fr_1fr] items-center border-t border-slate-200 px-4 py-2.5 transition hover:bg-blue-50"
                  >

                    <div className="text-xs font-black text-slate-900">
                      {valueOrDash(item.month)}
                    </div>

                    <div className="text-xs font-bold text-slate-600">
                      {valueOrDash(item.year)}
                    </div>

                    <div className="text-xs font-black text-slate-900">
                      {money(item.net_salary)}
                    </div>

                    <div className="text-center">

                      <button
                        type="button"
                        disabled={loading}
                        onClick={() =>
                          openPayslip(
                            item.month,
                            item.year
                          )
                        }
                        className="rounded-lg bg-blue-700 px-4 py-1.5 text-[11px] font-black text-white transition hover:bg-blue-800 disabled:opacity-50"
                      >
                        مشاهده فیش ←
                      </button>

                    </div>

                  </div>
                ))}

              </div>

              {/* Mobile */}
              <div className="space-y-2 md:hidden">

                {months.map((item, index) => (
                  <button
                    key={item.id || index}
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      openPayslip(
                        item.month,
                        item.year
                      )
                    }
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-right shadow-sm transition active:bg-blue-50 disabled:opacity-50"
                  >

                    <div className="min-w-0">

                      <div className="text-[10px] font-bold text-slate-500">
                        دوره حقوق
                      </div>

                      <div className="mt-0.5 text-sm font-black text-slate-900">
                        {valueOrDash(item.month)}
                      </div>

                      <div className="mt-0.5 text-[10px] text-slate-500">
                        سال {valueOrDash(item.year)}
                      </div>

                    </div>

                    <div className="text-left">

                      <div className="text-[10px] font-bold text-slate-500">
                        خالص پرداختی
                      </div>

                      <div className="mt-0.5 text-xs font-black text-slate-900">
                        {money(item.net_salary)}
                      </div>

                      <div className="mt-1 text-[10px] font-black text-blue-700">
                        مشاهده فیش ←
                      </div>

                    </div>

                  </button>
                ))}

              </div>

            </section>
          </>
        )}

        {/* ================= SELECTED PAYSLIP ================= */}

        {selectedPayslip && (
          <PayslipDocument
            payslip={selectedPayslip}
            onBack={() => {
              setSelectedPayslip(null);
              setError("");
            }}
            onPrint={printPayslip}
          />
        )}

        <footer className="py-5 text-center text-[10px] text-slate-500">
          © سیستم حقوق و دستمزد چابکان
        </footer>

      </div>
    </main>
  );
}