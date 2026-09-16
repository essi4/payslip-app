import test from "node:test";
import assert from "node:assert/strict";

const fs = await import("node:fs/promises");

async function read(path) {
  return fs.readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("employee order page supports uploaded PDF/image documents", async () => {
  const source = await read("app/payslip/order/page.js");
  assert.match(source, /order-document/);
  assert.match(source, /دانلود|Download/);
  assert.match(source, /چاپ/);
});

test("order document API is protected for admin upload and employee viewing", async () => {
  const source = await read("app/api/personnel/order-document/route.js");
  assert.match(source, /requireAdmin/);
  assert.match(source, /getEmployeeSession/);
  assert.match(source, /multipart\/form-data|formData/);
  assert.match(source, /application\/pdf|image\//);
});

test("admin order document screen allows assigning a PDF or image to a personnel record", async () => {
  const source = await read("app/admin/employees/order-document/page.js");
  assert.match(source, /انتخاب پرسنل/);
  assert.match(source, /PDF|تصویر/);
  assert.match(source, /order-document/);
});
