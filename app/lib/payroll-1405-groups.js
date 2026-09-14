// 1405 statutory 20-group wage floor table.
// Values are derived from the published 1404 20-group wage table using
// the 1405 "45% + 519,549 ریال/day" other-levels formula.
export const PAYROLL_1405_GROUP_WAGE_TABLE = Object.freeze({
  1: 5541850,
  2: 5551010,
  3: 5560171,
  4: 5569331,
  5: 5581544,
  6: 5593757,
  7: 5605971,
  8: 5621238,
  9: 5636503,
  10: 5654824,
  11: 5673143,
  12: 5691464,
  13: 5715891,
  14: 5740318,
  15: 5764744,
  16: 5795277,
  17: 5825811,
  18: 5862451,
  19: 5899091,
  20: 5944891,
});

export const PAYROLL_1405_GROUP_OPTIONS = Object.freeze(
  Array.from({ length: 20 }, (_, index) => index + 1).map((group) => ({
    value: String(group),
    label: `گروه ${group}`,
    dailyWage: PAYROLL_1405_GROUP_WAGE_TABLE[group],
  }))
);
