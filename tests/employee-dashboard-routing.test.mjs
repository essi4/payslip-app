import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

async function read(path) {
  return fs.readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("authenticated shell keeps nested employee pages reachable", async () => {
  const shell = await read("app/payslip/EmployeeAuthenticatedShell.js");
  assert.match(shell, /usePathname/);
  assert.match(shell, /pathname\s*===\s*["']\/payslip["']/);
  assert.match(shell, /children/);
});
