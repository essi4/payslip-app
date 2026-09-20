"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import CompanyWelcomeBanner from "./CompanyWelcomeBanner";
import EmployeeBottomNav from "./EmployeeBottomNav";

export default function EmployeeAuthenticatedShell({ children }) {
  const pathname = usePathname();
  const normalizedPathname = pathname?.replace(/\/+$/g, "") || "";

  // Keep the login landing page outside the authenticated shell.
  if (normalizedPathname === "/payslip") return children;

  return <AuthenticatedEmployeeChrome>{children}</AuthenticatedEmployeeChrome>;
}

function AuthenticatedEmployeeChrome({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checked, setChecked] = useState(false);
  const [employee, setEmployee] = useState(null);

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
        setChecked(true);
      })
      .catch(() => {
        if (!active) return;
        setAuthenticated(false);
        setEmployee(null);
        setChecked(true);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!checked) return null;
  if (!authenticated) return children;

  return (
    <>
      <CompanyWelcomeBanner employee={employee} />
      <div className="pb-24 pt-20 sm:pb-28 sm:pt-24">{children}</div>
      <EmployeeBottomNav />
    </>
  );
}
