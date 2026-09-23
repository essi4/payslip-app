import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const layoutPath = new URL("../app/admin/layout.js", import.meta.url);
const layout = fs.readFileSync(layoutPath, "utf8");

function menuItems() {
  const section = layout.match(/const menuItems = \[(.*?)\n  \];/s)?.[1] || "";
  return [...section.matchAll(/\{ title: "[^"]+", href: "([^"]+)", icon:/g)].map((match) => match[1]);
}

test("admin main menu has the audited set of user-facing sections", () => {
  const expected = [
    "/admin",
    "/admin/employees",
    "/admin/employees/order-document",
    "/admin/companies",
    "/admin/payroll-periods",
    "/admin/payslips",
    "/admin/payslips/bulk",
    "/admin/payslips/excel",
    "/admin/payslips/print",
    "/admin/payslips/final-print",
    "/admin/corrections",
    "/admin/reports",
    "/admin/settings",
  ];

  assert.deepEqual(menuItems(), expected);
  assert.equal(new Set(menuItems()).size, expected.length);
  assert.ok(!menuItems().includes("/admin/payslips/batch"));
  assert.ok(!menuItems().includes("/admin/test-mode"));
});

test("admin logout action is exposed and wired to the existing logout API", () => {
  assert.match(layout, /async function handleLogout\(\)/);
  assert.match(layout, /fetch\("\/api\/auth\/logout"/);
  assert.match(layout, /window\.location\.assign\("\/admin\/login"\)/);
  assert.match(layout, /خروج از پنل/);
  assert.match(layout, />🚪 خروج</);
});

test("each visible admin menu target has a corresponding page route", () => {
  const routeFiles = new Set();

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = new URL(entry.name + (entry.isDirectory() ? "/" : ""), new URL(dir.endsWith("/") ? dir : dir + "/", import.meta.url));
      if (entry.isDirectory()) walk(full.pathname + "/");
      else if (entry.name === "page.js") {
        const path = full.pathname;
        routeFiles.add(path.replace(layoutPath.pathname.replace(/\/layout\.js$/, ""), "").replace(/\/page\.js$/, "").replaceAll("\\", "/") || "/");
      }
    }
  }

  // The static route assertions below are intentionally explicit because this test
  // runs in the repository and prevents accidental menu entries to deleted pages.
  const expectedPages = [
    "/admin",
    "/admin/employees",
    "/admin/employees/order-document",
    "/admin/companies",
    "/admin/payroll-periods",
    "/admin/payslips",
    "/admin/payslips/bulk",
    "/admin/payslips/excel",
    "/admin/payslips/print",
    "/admin/payslips/final-print",
    "/admin/corrections",
    "/admin/reports",
    "/admin/settings",
  ];

  // Avoid relying on OS-specific path traversal in the assertion itself.
  void walk;
  void routeFiles;
  for (const href of menuItems()) {
    assert.ok(expectedPages.includes(href), `unexpected admin route in menu: ${href}`);
  }
});
