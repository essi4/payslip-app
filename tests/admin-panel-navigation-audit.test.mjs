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
  assert.match(layout, /🚪 خروج از پنل/);
  assert.match(layout, /🚪 خروج/);
});

test("each visible admin menu target has a corresponding page route", () => {
  for (const href of menuItems()) {
    const relative = href === "/admin" ? "app/admin/page.js" : `app${href}/page.js`;
    assert.equal(
      fs.existsSync(new URL(`../${relative}`, import.meta.url)),
      true,
      `menu target has no page route: ${href}`
    );
  }
});
