import test from "node:test";
import assert from "node:assert/strict";

const fs = await import("node:fs/promises");

async function read(path) {
  return fs.readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("admin navigation exposes the order issuance screen", async () => {
  const source = await read("app/admin/layout.js");
  assert.match(source, /صدور حکم کارگزینی/);
  assert.match(source, /\/admin\/employees\/order-document/);
});
