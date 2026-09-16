"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import CompanyWelcomeBanner from "./CompanyWelcomeBanner";
import EmployeeBottomNav from "./EmployeeBottomNav";
import EmployeeDashboardHome from "./EmployeeDashboardHome";

export default function EmployeeAuthenticatedShell({ children }) {
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/payslip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({}),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!active) return;
        setAuthenticated(Boolean(data?.success && data?.employee));
        setChecked(true);
      })
      .catch(() => {
        if (!active) return;
        setAuthenticated(false);
        setChecked(true);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!checked || !authenticated) return children;

  const isHome = pathname === "/payslip";

  return (
    <>
      <CompanyWelcomeBanner />
      {isHome ? <EmployeeDashboardHome /> : <div className="pt-20 sm:pt-24">{children}</div>}
      <EmployeeBottomNav />
    </>
  );
}
