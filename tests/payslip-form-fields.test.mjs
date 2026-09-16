import test from "node:test";
import assert from "node:assert/strict";

const fs = await import("node:fs/promises");

async function read(path) {
  return fs.readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("payslip form labels the personnel field as job group", async () => {
  const source = await read("app/admin/payslips/page.js");
  assert.match(source, /<label>۲\. گروه شغلی<\/label>/);
  assert.doesNotMatch(source, /<label>۲\. گروه مزدی<\/label>/);
});

test("payslip work days input allows up to 31 days", async () => {
  const source = await read("app/admin/payslips/page.js");
  assert.match(source, /max=\{31\}/);
  assert.match(source, /حداکثر کارکرد: ۳۱ روز/);
});
