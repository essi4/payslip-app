import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const layoutPath = new URL("../app/admin/layout.js", import.meta.url);
const layout = fs.readFileSync(layoutPath, "utf8");

function menuItems() {
  const section = layout.match(/const menuItems = \[(.*?)\];/s)?.[1] || "";
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

test("admin login is isolated from the authenticated admin shell", () => {
  assert.match(
    layout,
    /if \(pathname === "\/admin\/login"\) \{\s*return <\/>/
  );
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


test("admin navigation highlights only the most specific matching route", () => {
  assert.match(layout, /const activeHref =/);
  assert.match(layout, /\.sort\(\(a, b\) => b\.href\.length - a\.href\.length\)/);
  assert.match(layout, /return activeHref === item\.href/);
});

test("mobile admin navigation keeps primary links compact and secondary links behind more", () => {
  assert.match(layout, /const MOBILE_PRIMARY_HREFS = new Set\(/);
  assert.doesNotMatch(layout, /mobilePrimaryHrefs/);
  assert.match(layout, /const mobileMoreItems = menuItems\.filter\(/);
  assert.match(layout, /aria-expanded=\{mobileMenuOpen\}/);
  assert.match(layout, /بیشتر/);
});


test("desktop admin sidebar keeps a scrollable menu area above the fixed footer", () => {
  assert.match(layout, /fixed right-0 top-0 z-40 hidden h-screen w-64 flex-col/);
  assert.match(layout, /min-h-0 flex-1 overflow-y-auto/);
  assert.match(layout, /shrink-0 border-t border-slate-700/);
});
