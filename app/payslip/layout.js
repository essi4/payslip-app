import Link from "next/link";

export default function PayslipLayout({ children }) {
  return (
    <>
      {children}
      <Link
        href="/payslip/account"
        className="no-print fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-700 px-4 py-3 text-xs font-black text-white shadow-xl shadow-blue-950/20 transition hover:bg-blue-800 active:scale-95"
        aria-label="حساب من"
      >
        <span aria-hidden="true">👤</span>
        حساب من
      </Link>
    </>
  );
}
