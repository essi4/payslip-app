"use client";

import { useEffect, useState } from "react";
import "./payslip-view.css";

export default function PayslipView({ params }) {
  const [payslip, setPayslip] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // دریافت فیش
        const payslipResponse = await fetch("/api/payslips", {
          cache: "no-store",
        });

        const payslipResult = await payslipResponse.json();

        if (
          payslipResult.success &&
          Array.isArray(payslipResult.data)
        ) {
          const found = payslipResult.data.find(
            (item) => String(item.id) === String(params.id)
          );

          setPayslip(found || null);
        }

        // دریافت تنظیمات سامانه
        try {
          const settingsResponse = await fetch("/api/settings", {
            cache: "no-store",
          });

          const settingsResult = await settingsResponse.json();

          if (
            settingsResult.success &&
            settingsResult.data
          ) {
            setSettings(settingsResult.data);
          }
        } catch (settingsError) {
          console.error(
            "خطا در دریافت تنظیمات:",
            settingsError
          );
        }
      } catch (error) {
        console.error(
          "خطا در دریافت فیش:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params.id]);

  // =========================
  // وضعیت بارگذاری
  // =========================

  if (loading) {
    return (
      <div className="payslip-loading" dir="rtl">
        <div>
          <div className="loading-spinner"></div>
          <p>در حال دریافت فیش حقوقی...</p>
        </div>
      </div>
    );
  }

  // =========================
  // فیش پیدا نشد
  // =========================

  if (!payslip) {
    return (
      <div className="payslip-loading" dir="rtl">
        <div>
          <h2>فیش حقوقی پیدا نشد</h2>

          <p>
            فیش موردنظر وجود ندارد یا حذف شده است.
          </p>

          <button
            type="button"
            onClick={() => window.history.back()}
          >
            ← بازگشت
          </button>
        </div>
      </div>
    );
  }

  // =========================
  // تنظیمات پیش‌فرض
  // =========================

  const companyName =
    settings?.company_name || "شرکت";

  const systemTitle =
    settings?.system_title ||
    "سیستم حقوق و دستمزد";

  const currency =
    settings?.currency || "تومان";

  const managerName =
    settings?.manager_name || "";

  const managerPosition =
    settings?.manager_position || "";

  const footerText =
    settings?.footer_text || "";

  const showCompanyName =
    settings?.show_company_name !== false;

  const showBankAccount =
    settings?.show_bank_account !== false;

  const showJobGroup =
    settings?.show_job_group !== false;

  const showJobTitle =
    settings?.show_job_title !== false;

  const printOrientation =
    settings?.print_orientation || "portrait";

  // =========================
  // اطلاعات مالی
  // =========================

  const number = (value) =>
    Number(value) || 0;

  const base =
    number(payslip.base_salary);

  const overtime =
    number(payslip.overtime);

  const bonus =
    number(payslip.bonus);

  const housing =
    number(payslip.housing_allowance);

  const food =
    number(payslip.food_allowance);

  const marriage =
    number(payslip.marriage_allowance);

  const child =
    number(payslip.child_allowance);

  const otherBenefits =
    number(payslip.other_benefits);

  const insurance =
    number(payslip.insurance);

  const tax =
    number(payslip.tax);

  const otherDeductions =
    number(payslip.other_deductions);

  // =========================
  // محاسبه مزایا
  // =========================

  const totalBenefits =
    overtime +
    bonus +
    housing +
    food +
    marriage +
    child +
    otherBenefits;

  // =========================
  // محاسبه کسورات
  // =========================

  const totalDeductions =
    insurance +
    tax +
    otherDeductions;

  // =========================
  // خالص
  // =========================

  const calculatedNet =
    base +
    totalBenefits -
    totalDeductions;

  const net =
    payslip.net_salary !== undefined &&
    payslip.net_salary !== null
      ? number(payslip.net_salary)
      : calculatedNet;

  // =========================
  // نام کارمند
  // =========================

  const employeeName =
    payslip.full_name ||
    payslip.name ||
    payslip.employee_name ||
    "نامشخص";

  const personnelCode =
    payslip.personnel_code ||
    payslip.code ||
    "---";

  // =========================
  // چاپ
  // =========================

  function handlePrint() {
    window.print();
  }

  // =========================
  // فرمت مبلغ
  // =========================

  function money(value) {
    return `${number(value).toLocaleString(
      "fa-IR"
    )} ${currency}`;
  }

  // =========================
  // تاریخ صدور
  // =========================

  function formatDate(date) {
    if (!date) {
      return "---";
    }

    try {
      return new Date(date).toLocaleDateString(
        "fa-IR"
      );
    } catch {
      return "---";
    }
  }

  // =========================
  // کلاس جهت چاپ
  // =========================

  const orientationClass =
    printOrientation === "landscape"
      ? "print-landscape"
      : "print-portrait";

  return (
    <div
      className={`payslip-page ${orientationClass}`}
      dir="rtl"
    >

      {/* =====================================
          دکمه‌های بالا
      ====================================== */}

      <div className="payslip-actions no-print">

        <button
          type="button"
          onClick={handlePrint}
          className="print-button"
        >
          🖨 چاپ فیش
        </button>

        <button
          type="button"
          onClick={() => window.history.back()}
          className="back-button"
        >
          ← بازگشت
        </button>

      </div>


      {/* =====================================
          برگه فیش
      ====================================== */}

      <div className="payslip-paper">

        {/* =====================================
            هدر شرکت
        ====================================== */}

        <div className="company-header">

          <div className="company-title">

            {showCompanyName && (
              <h1>
                {companyName}
              </h1>
            )}

            <h2>
              {systemTitle}
            </h2>

            <p>
              فیش حقوقی
            </p>

          </div>

          <div className="payslip-number">

            <span>
              شماره فیش
            </span>

            <strong>
              #{payslip.id}
            </strong>

          </div>

        </div>


        {/* =====================================
            دوره حقوق
        ====================================== */}

        <div className="period">

          <div>
            <span>
              سال
            </span>

            <strong>
              {payslip.year || "---"}
            </strong>
          </div>

          <div>
            <span>
              ماه
            </span>

            <strong>
              {payslip.month || "---"}
            </strong>
          </div>

          <div>
            <span>
              وضعیت
            </span>

            <strong className="approved">
              صادر شده
            </strong>
          </div>

        </div>


        {/* =====================================
            اطلاعات کارمند
        ====================================== */}

        <div className="employee-info">

          <h2>
            👤 اطلاعات کارمند
          </h2>

          <div className="info-grid">

            <div>
              <span>
                نام و نام خانوادگی
              </span>

              <strong>
                {employeeName}
              </strong>
            </div>


            <div>
              <span>
                کد پرسنلی
              </span>

              <strong>
                {personnelCode}
              </strong>
            </div>


            {showBankAccount && (
              <div>
                <span>
                  شماره حساب
                </span>

                <strong>
                  {payslip.bank_account || "---"}
                </strong>
              </div>
            )}


            {showJobGroup && (
              <div>
                <span>
                  گروه شغلی
                </span>

                <strong>
                  {payslip.job_group || "---"}
                </strong>
              </div>
            )}


            {showJobTitle && (
              <div>
                <span>
                  عنوان شغلی
                </span>

                <strong>
                  {payslip.job_title || "---"}
                </strong>
              </div>
            )}

          </div>

        </div>


        {/* =====================================
            جزئیات حقوق
        ====================================== */}

        <div className="salary-section">

          <h2>
            💰 جزئیات حقوق و مزایا
          </h2>

          <table>

            <thead>
              <tr>
                <th>
                  شرح
                </th>

                <th>
                  مبلغ
                </th>
              </tr>
            </thead>


            <tbody>

              {/* حقوق پایه */}

              <tr>
                <td>
                  حقوق پایه
                </td>

                <td>
                  {money(base)}
                </td>
              </tr>


              {/* اضافه کاری */}

              <tr>
                <td>
                  اضافه کاری
                </td>

                <td>
                  {money(overtime)}
                </td>
              </tr>


              {/* پاداش */}

              <tr>
                <td>
                  پاداش
                </td>

                <td>
                  {money(bonus)}
                </td>
              </tr>


              {/* حق مسکن */}

              <tr>
                <td>
                  حق مسکن
                </td>

                <td>
                  {money(housing)}
                </td>
              </tr>


              {/* بن */}

              <tr>
                <td>
                  بن خواربار
                </td>

                <td>
                  {money(food)}
                </td>
              </tr>


              {/* تأهل */}

              <tr>
                <td>
                  حق تأهل
                </td>

                <td>
                  {money(marriage)}
                </td>
              </tr>


              {/* اولاد */}

              <tr>
                <td>
                  حق اولاد
                </td>

                <td>
                  {money(child)}
                </td>
              </tr>


              {/* سایر مزایا */}

              <tr>
                <td>
                  سایر مزایا
                </td>

                <td>
                  {money(otherBenefits)}
                </td>
              </tr>


              {/* مجموع مزایا */}

              <tr className="total-row benefits-total">

                <td>
                  مجموع مزایا
                </td>

                <td>
                  {money(totalBenefits)}
                </td>

              </tr>


              {/* خط جداکننده */}

              <tr className="separator-row">
                <td colSpan="2"></td>
              </tr>


              {/* بیمه */}

              <tr className="deduction">

                <td>
                  حق بیمه
                </td>

                <td>
                  - {money(insurance)}
                </td>

              </tr>


              {/* مالیات */}

              <tr className="deduction">

                <td>
                  مالیات
                </td>

                <td>
                  - {money(tax)}
                </td>

              </tr>


              {/* سایر کسورات */}

              <tr className="deduction">

                <td>
                  سایر کسورات
                </td>

                <td>
                  - {money(otherDeductions)}
                </td>

              </tr>


              {/* مجموع کسورات */}

              <tr className="total-row deductions-total">

                <td>
                  مجموع کسورات
                </td>

                <td>
                  - {money(totalDeductions)}
                </td>

              </tr>

            </tbody>

          </table>

        </div>


        {/* =====================================
            خالص پرداختی
        ====================================== */}

        <div className="net-pay">

          <span>
            خالص پرداختی
          </span>

          <strong>
            {net.toLocaleString(
              "fa-IR"
            )}
          </strong>

          <small>
            {currency}
          </small>

        </div>


        {/* =====================================
            پایین فیش
        ====================================== */}

        <div className="footer">

          <div className="issue-date">

            <span>
              تاریخ صدور
            </span>

            <strong>
              {formatDate(
                payslip.created_at
              )}
            </strong>

          </div>


          <div className="signature">

            <span>
              مسئول تأیید فیش
            </span>

            {managerName && (
              <strong>
                {managerName}
              </strong>
            )}

            {managerPosition && (
              <small>
                {managerPosition}
              </small>
            )}

            <div className="signature-line"></div>

            <span>
              مهر و امضا
            </span>

          </div>

        </div>


        {/* =====================================
            متن پایین فیش
        ====================================== */}

        {footerText && (
          <div className="footer-text">
            {footerText}
          </div>
        )}


        {/* =====================================
            نام سیستم
        ====================================== */}

        <div className="system-footer">
          {systemTitle}
        </div>

      </div>

    </div>
  );
}