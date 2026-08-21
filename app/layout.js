import "./globals.css";

export const metadata = {
  title: "سامانه آنلاین فیش حقوقی شرکت عرصه ساز لب رود",
  description:
    "سامانه دریافت آنلاین فیش حقوقی و مزایای پرسنل شرکت عرصه ساز لب رود",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}