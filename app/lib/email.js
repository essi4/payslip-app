import nodemailer from "nodemailer";

function getTransporter() {
  const service = process.env.SMTP_SERVICE;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "false") === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error("SMTP_USER و SMTP_PASS در Environment Variables تنظیم نشده‌اند.");
  }

  const options = service
    ? { service, auth: { user, pass } }
    : { host, port, secure, auth: { user, pass } };

  return nodemailer.createTransport(options);
}

export async function sendPasswordRecoveryCode({ to, code, employeeName }) {
  if (!to) {
    throw new Error("ایمیل پرسنل ثبت نشده است.");
  }

  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to,
    subject: "کد بازیابی رمز عبور سامانه فیش حقوقی",
    text: `سلام ${employeeName || "کارمند گرامی"}\n\nکد بازیابی رمز عبور شما: ${code}\n\nاین کد تا ۱۰ دقیقه معتبر است و فقط یک بار قابل استفاده است.\nاگر این درخواست توسط شما انجام نشده است، این ایمیل را نادیده بگیرید.`,
    html: `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:2;color:#0f172a"><h2>بازیابی رمز عبور</h2><p>سلام ${employeeName || "کارمند گرامی"}</p><p>کد بازیابی رمز عبور شما:</p><div style="font-size:32px;font-weight:800;letter-spacing:8px;background:#f1f5f9;padding:14px;text-align:center;border-radius:12px">${code}</div><p>این کد تا <strong>۱۰ دقیقه</strong> معتبر است و فقط یک بار قابل استفاده است.</p><p style="color:#64748b;font-size:12px">اگر این درخواست توسط شما انجام نشده است، این ایمیل را نادیده بگیرید.</p></div>`,
  });
}
