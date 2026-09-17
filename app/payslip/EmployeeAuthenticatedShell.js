"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import CompanyWelcomeBanner from "./CompanyWelcomeBanner";

export default function EmployeeAuthenticatedShell({ children }) {
  const pathname = usePathname();
  const normalizedPathname = pathname?.replace(/\/+$/g, "") || "";

  // The root employee URL is always the login landing page. Keep it completely
  // outside the authenticated shell so an existing session can never add the
  // welcome banner to the first screen.
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
    return () => { active = false; };
  }, []);

  if (!checked) return null;
  if (!authenticated) return children;

  return (
    <>
      <CompanyWelcomeBanner employee={employee} />
      <div className="pt-20 sm:pt-24">{children}</div>
    </>
  );
}
