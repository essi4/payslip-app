"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import CompanyWelcomeBanner from "./CompanyWelcomeBanner";
import EmployeeBottomNav from "./EmployeeBottomNav";
import EmployeeDashboardHome from "./EmployeeDashboardHome";

export default function EmployeeAuthenticatedShell({ children }) {
  const pathname = usePathname();
  const normalizedPathname = pathname?.replace(/\/+$/g, "") || "";
  const [authenticated, setAuthenticated] = useState(false);
  const [checked, setChecked] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [months, setMonths] = useState([]);

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
        const loggedIn = Boolean(data?.success && data?.employee);
        setAuthenticated(loggedIn);
        setEmployee(loggedIn ? data.employee : null);
        setMonths(loggedIn && Array.isArray(data.months) ? data.months : []);
        setChecked(true);
      })
      .catch(() => {
        if (!active) return;
        setAuthenticated(false);
        setEmployee(null);
        setMonths([]);
        setChecked(true);
      });
    return () => { active = false; };
  }, []);

  if (!checked) return null;
  if (!authenticated) return children;

  // Root /payslip is permanently login-only, even when an employee session exists.
  // Authenticated employees use /payslip/slips, /payslip/order, and /payslip/account.
  if (normalizedPathname === "/payslip") return children;

  return (
    <>
      <CompanyWelcomeBanner employee={employee} />
      <div className="pt-20 sm:pt-24">{children}</div>
      <EmployeeBottomNav />
    </>
  );
}
