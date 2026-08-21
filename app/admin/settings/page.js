"use client";

import "./settings.css";
import { useEffect, useState } from "react";

const defaultSettings = {
  company_name: "",
  system_title: "سیستم حقوق و دستمزد",
  fiscal_year: "1405",
  current_month: "فروردین",
  currency: "تومان",

  phone: "",
  email: "",
  address: "",

  manager_name: "",
  manager_position: "",

  show_company_name: true,
  show_bank_account: true,
  show_job_group: true,
  show_job_title: true,

  footer_text: "",

  print_orientation: "portrait",
};

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

export default function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);

      const response = await fetch("/api/settings", {
        cache: "no-store",
      });

      const result = await response.json();

      if (result.success && result.data) {
        setSettings({
          ...defaultSettings,
          ...result.data,
        });
      } else {
        showMessage(
          result.error || "خطا در دریافت تنظیمات",
          "error"
        );
      }
    } catch (error) {
      console.error(error);

      showMessage(
        "خطا در اتصال به سرور",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  function showMessage(text, type) {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3500);
  }

  function updateField(field, value) {
    setSettings((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSave(event) {
    event.preventDefault();

    try {
      setSaving(true);

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        showMessage(
          result.error ||
            result.message ||
            "ذخیره تنظیمات انجام نشد",
          "error"
        );

        return;
      }

      if (result.data) {
        setSettings({
          ...defaultSettings,
          ...result.data,
        });
      }

      showMessage(
        "تنظیمات با موفقیت ذخیره شد ✓",
        "success"
      );
    } catch (error) {
      console.error(error);

      showMessage(
        "خطا در اتصال به سرور",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    const confirmed = window.confirm(
      "آیا می‌خواهید تنظیمات فرم به آخرین اطلاعات ذخیره‌شده برگردد؟"
    );

    if (!confirmed) {
      return;
    }

    loadSettings();
  }

  if (loading) {
    return (
      <div
        className="settings-page"
        dir="rtl"
      >
        <div className="settings-loading">
          در حال دریافت تنظیمات سامانه...
        </div>
      </div>
    );
  }

  return (
    <div
      className="settings-page"
      dir="rtl"
    >
      <div className="settings-container">

        {/* Header */}

        <div className="settings-header">

          <div className="settings-title-row">

            <div className="settings-title-icon">
              ⚙️
            </div>

            <div>
              <h1>
                تنظیمات سامانه
              </h1>

              <p>
                مدیریت اطلاعات شرکت و تنظیمات سیستم حقوق و دستمزد
              </p>
            </div>

          </div>

          <div className="system-status">
            <span className="status-dot"></span>
            وضعیت سامانه: فعال
          </div>

        </div>

        {/* Message */}

        {message && (
          <div
            className={`settings-message ${messageType}`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSave}>

          <div className="settings-grid">

            {/* اطلاعات شرکت */}

            <section className="settings-card">

              <div className="settings-card-header">

                <div className="settings-card-icon">
                  🏢
                </div>

                <div>
                  <h2>
                    اطلاعات شرکت و سامانه
                  </h2>

                  <p>
                    اطلاعات اصلی که در پنل و فیش حقوقی نمایش داده می‌شود
                  </p>
                </div>

              </div>

              <div className="settings-form-grid">

                <div className="settings-field">

                  <label>
                    نام شرکت
                  </label>

                  <input
                    type="text"
                    value={settings.company_name}
                    onChange={(e) =>
                      updateField(
                        "company_name",
                        e.target.value
                      )
                    }
                    placeholder="مثلاً شرکت چابکان"
                  />

                </div>

                <div className="settings-field">

                  <label>
                    عنوان سامانه
                  </label>

                  <input
                    type="text"
                    value={settings.system_title}
                    onChange={(e) =>
                      updateField(
                        "system_title",
                        e.target.value
                      )
                    }
                    placeholder="سیستم حقوق و دستمزد"
                  />

                </div>

                <div className="settings-field">

                  <label>
                    سال مالی
                  </label>

                  <input
                    type="text"
                    value={settings.fiscal_year}
                    onChange={(e) =>
                      updateField(
                        "fiscal_year",
                        e.target.value
                      )
                    }
                  />

                </div>

                <div className="settings-field">

                  <label>
                    ماه جاری
                  </label>

                  <select
                    value={settings.current_month}
                    onChange={(e) =>
                      updateField(
                        "current_month",
                        e.target.value
                      )
                    }
                  >
                    {months.map((month) => (
                      <option
                        key={month}
                        value={month}
                      >
                        {month}
                      </option>
                    ))}
                  </select>

                </div>

                <div className="settings-field">

                  <label>
                    واحد پول
                  </label>

                  <select
                    value={settings.currency}
                    onChange={(e) =>
                      updateField(
                        "currency",
                        e.target.value
                      )
                    }
                  >
                    <option value="تومان">
                      تومان
                    </option>

                    <option value="ریال">
                      ریال
                    </option>
                  </select>

                </div>

              </div>

            </section>

            {/* اطلاعات تماس */}

            <section className="settings-card">

              <div className="settings-card-header">

                <div className="settings-card-icon">
                  📞
                </div>

                <div>
                  <h2>
                    اطلاعات تماس
                  </h2>

                  <p>
                    اطلاعات تماس شرکت
                  </p>
                </div>

              </div>

              <div className="settings-form-grid">

                <div className="settings-field">

                  <label>
                    شماره تلفن
                  </label>

                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) =>
                      updateField(
                        "phone",
                        e.target.value
                      )
                    }
                    placeholder="021..."
                  />

                </div>

                <div className="settings-field">

                  <label>
                    ایمیل
                  </label>

                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) =>
                      updateField(
                        "email",
                        e.target.value
                      )
                    }
                    placeholder="info@example.com"
                  />

                </div>

                <div className="settings-field full">

                  <label>
                    آدرس شرکت
                  </label>

                  <textarea
                    value={settings.address}
                    onChange={(e) =>
                      updateField(
                        "address",
                        e.target.value
                      )
                    }
                    placeholder="آدرس کامل شرکت..."
                  />

                </div>

              </div>

            </section>

            {/* مسئول تأیید */}

            <section className="settings-card">

              <div className="settings-card-header">

                <div className="settings-card-icon">
                  👤
                </div>

                <div>
                  <h2>
                    مسئول تأیید فیش
                  </h2>

                  <p>
                    نام مسئول در پایین فیش حقوقی نمایش داده می‌شود
                  </p>
                </div>

              </div>

              <div className="settings-form-grid">

                <div className="settings-field">

                  <label>
                    نام و نام خانوادگی مسئول
                  </label>

                  <input
                    type="text"
                    value={settings.manager_name}
                    onChange={(e) =>
                      updateField(
                        "manager_name",
                        e.target.value
                      )
                    }
                    placeholder="نام مسئول"
                  />

                </div>

                <div className="settings-field">

                  <label>
                    سمت مسئول
                  </label>

                  <input
                    type="text"
                    value={settings.manager_position}
                    onChange={(e) =>
                      updateField(
                        "manager_position",
                        e.target.value
                      )
                    }
                    placeholder="مثلاً مدیرعامل"
                  />

                </div>

              </div>

            </section>

            {/* تنظیمات فیش */}

            <section className="settings-card">

              <div className="settings-card-header">

                <div className="settings-card-icon">
                  📄
                </div>

                <div>
                  <h2>
                    تنظیمات فیش حقوقی
                  </h2>

                  <p>
                    مشخص کنید چه اطلاعاتی در فیش نمایش داده شود
                  </p>
                </div>

              </div>

              <div className="switch-list">

                <label className="switch-item">

                  <div className="switch-text">
                    <strong>
                      نمایش نام شرکت
                    </strong>

                    <span>
                      نام شرکت در بالای فیش
                    </span>
                  </div>

                  <span className="toggle">

                    <input
                      type="checkbox"
                      checked={
                        settings.show_company_name
                      }
                      onChange={(e) =>
                        updateField(
                          "show_company_name",
                          e.target.checked
                        )
                      }
                    />

                    <span className="toggle-slider"></span>

                  </span>

                </label>

                <label className="switch-item">

                  <div className="switch-text">
                    <strong>
                      نمایش شماره حساب
                    </strong>

                    <span>
                      شماره حساب کارمند
                    </span>
                  </div>

                  <span className="toggle">

                    <input
                      type="checkbox"
                      checked={
                        settings.show_bank_account
                      }
                      onChange={(e) =>
                        updateField(
                          "show_bank_account",
                          e.target.checked
                        )
                      }
                    />

                    <span className="toggle-slider"></span>

                  </span>

                </label>

                <label className="switch-item">

                  <div className="switch-text">
                    <strong>
                      نمایش گروه شغلی
                    </strong>

                    <span>
                      گروه شغلی کارمند
                    </span>
                  </div>

                  <span className="toggle">

                    <input
                      type="checkbox"
                      checked={
                        settings.show_job_group
                      }
                      onChange={(e) =>
                        updateField(
                          "show_job_group",
                          e.target.checked
                        )
                      }
                    />

                    <span className="toggle-slider"></span>

                  </span>

                </label>

                <label className="switch-item">

                  <div className="switch-text">
                    <strong>
                      نمایش عنوان شغلی
                    </strong>

                    <span>
                      عنوان شغلی کارمند
                    </span>
                  </div>

                  <span className="toggle">

                    <input
                      type="checkbox"
                      checked={
                        settings.show_job_title
                      }
                      onChange={(e) =>
                        updateField(
                          "show_job_title",
                          e.target.checked
                        )
                      }
                    />

                    <span className="toggle-slider"></span>

                  </span>

                </label>

              </div>

              <div
                className="settings-field"
                style={{ marginTop: "18px" }}
              >

                <label>
                  متن پایین فیش
                </label>

                <textarea
                  value={settings.footer_text}
                  onChange={(e) =>
                    updateField(
                      "footer_text",
                      e.target.value
                    )
                  }
                  placeholder="مثلاً این فیش با سیستم حقوق و دستمزد شرکت صادر شده است."
                />

              </div>

            </section>

            {/* تنظیمات چاپ */}

            <section className="settings-card full-width">

              <div className="settings-card-header">

                <div className="settings-card-icon">
                  🖨️
                </div>

                <div>
                  <h2>
                    تنظیمات چاپ
                  </h2>

                  <p>
                    نحوه چاپ فیش‌های حقوقی
                  </p>
                </div>

              </div>

              <div className="settings-field">

                <label>
                  جهت چاپ
                </label>

                <div className="orientation-grid">

                  <div
                    className={`orientation-option ${
                      settings.print_orientation ===
                      "portrait"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      updateField(
                        "print_orientation",
                        "portrait"
                      )
                    }
                  >

                    <div className="orientation-icon">
                      📄
                    </div>

                    <strong>
                      عمودی
                    </strong>

                    <span>
                      Portrait
                    </span>

                  </div>

                  <div
                    className={`orientation-option ${
                      settings.print_orientation ===
                      "landscape"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      updateField(
                        "print_orientation",
                        "landscape"
                      )
                    }
                  >

                    <div className="orientation-icon">
                      🖼️
                    </div>

                    <strong>
                      افقی
                    </strong>

                    <span>
                      Landscape
                    </span>

                  </div>

                </div>

              </div>

            </section>

          </div>

          {/* Buttons */}

          <div className="settings-actions">

            <button
              type="button"
              onClick={handleReset}
              className="reset-settings-button"
              disabled={saving}
            >
              ↻ بازگردانی تنظیمات
            </button>

            <button
              type="submit"
              className="save-settings-button"
              disabled={saving}
            >
              {saving
                ? "در حال ذخیره..."
                : "✓ ذخیره تنظیمات"}
            </button>

          </div>

        </form>

        <div className="settings-footer">
          {settings.system_title || "سیستم حقوق و دستمزد"}
          {" — "}
          تنظیمات سامانه
        </div>

      </div>
    </div>
  );
}