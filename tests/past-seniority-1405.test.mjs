import test from "node:test";
import assert from "node:assert/strict";

const DAILY_PAST_SENIORITY = 1658848;

test("past seniority allowance is 49,765,440 for 30 days", () => {
  assert.equal(DAILY_PAST_SENIORITY * 30, 49765440);
});

test("past seniority allowance is 51,424,288 for 31 days", () => {
  assert.equal(DAILY_PAST_SENIORITY * 31, 51424288);
});
