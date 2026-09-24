"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, ClipboardList, UserRound } from "lucide-react";

const items = [
  { href: "/payslip/dashboard", label: "خانه", icon: Home },
  { href: "/payslip/slips", label: "فیش‌ها", icon: FileText },
  { href: "/payslip/order", label: "حکم", icon: ClipboardList },
  { href: "/payslip/account", label: "حساب من", icon: UserRound },
];

function isActive(pathname, href) {
  if (href === "/payslip/dashboard") return pathname === href;
  return pathname === href || pathname?.startsWith(href + "/");
}

export default function EmployeeBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      dir="rtl"
      aria-label="ناوبری پنل کارمند"
      className="no-print fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-[26px] border border-slate-200/80 bg-white/95 p-2 shadow-[0_18px_50px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:bottom-5 sm:p-2.5"
    >
      <div className="grid grid-cols-4 gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "flex min-h-14 flex-col items-center justify-center gap-1 rounded-[20px] bg-blue-700 px-2 py-2 text-white shadow-md shadow-blue-700/20"
                  : "flex min-h-14 flex-col items-center justify-center gap-1 rounded-[20px] px-2 py-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              }
            >
              <Icon size={19} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
              <span className="text-[10px] font-black sm:text-[11px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
