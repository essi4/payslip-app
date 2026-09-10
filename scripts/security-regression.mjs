const baseUrl = (process.env.BASE_URL || "").replace(/\/$/, "");

if (!baseUrl) {
  console.error("FAIL | BASE_URL is required");
  process.exit(1);
}

const adminGetPaths = [
  "/api/companies",
  "/api/personnel",
  "/api/payslips",
  "/api/corrections",
  "/api/payroll-periods",
  "/api/dashboard",
  "/api/reports",
  "/api/settings",
  "/api/fix-payslips",
];

const adminPostPaths = [
  {
    path: "/api/personnel/import",
    body: {},
  },
  {
    path: "/api/personnel/email",
    body: { id: "invalid", email: "invalid@example.com" },
  },
];

const sessionHeaders = {
  forged: { cookie: "admin_logged_in=true" },
  invalid: { cookie: "admin_session=invalid-expired-token" },
};

const tests = [
  ...adminGetPaths.map((path) => ({
    name: `NO ADMIN | GET ${path} => 401`,
    method: "GET",
    path,
    expected: [401],
  })),
  ...adminGetPaths.map((path) => ({
    name: `FORGED SESSION | GET ${path} => 401`,
    method: "GET",
    path,
    headers: sessionHeaders.forged,
    expected: [401],
  })),
  ...adminGetPaths.map((path) => ({
    name: `INVALID SESSION | GET ${path} => 401`,
    method: "GET",
    path,
    headers: sessionHeaders.invalid,
    expected: [401],
  })),
  ...adminPostPaths.flatMap(({ path, body }) => [
    {
      name: `NO ADMIN | POST ${path} => 401`,
      method: "POST",
      path,
      body,
      expected: [401],
    },
    {
      name: `FORGED SESSION | POST ${path} => 401`,
      method: "POST",
      path,
      body,
      headers: sessionHeaders.forged,
      expected: [401],
    },
    {
      name: `INVALID SESSION | POST ${path} => 401`,
      method: "POST",
      path,
      body,
      headers: sessionHeaders.invalid,
      expected: [401],
    },
  ]),
  {
    name: "PASSWORD QUERY STRING | payslip GET must not authenticate",
    method: "GET",
    path: "/api/payslip?nationalId=0000000000&password=test-password",
    expected: [400, 401, 404, 405],
  },
];

function containsSensitive(text) {
  return /(payslip_password|password_reset_code|password_reset_expires_at|admin_password|ADMIN_PASSWORD)/i.test(text);
}

let passed = 0;
let failed = 0;

for (const test of tests) {
  const url = `${baseUrl}${test.path}`;
  const started = Date.now();
  try {
    const headers = {
      ...(test.headers || {}),
      ...(test.body ? { "content-type": "application/json" } : {}),
    };
    const response = await fetch(url, {
      method: test.method,
      headers,
      body: test.body ? JSON.stringify(test.body) : undefined,
      redirect: "manual",
    });
    const body = await response.text();
    const ms = Date.now() - started;
    const statusOk = test.expected.includes(response.status);
    const leak = containsSensitive(body);
    const ok = statusOk && !leak;

    if (ok) {
      passed++;
      console.log(`PASS | ${test.name} | HTTP ${response.status} | ${ms}ms | no-sensitive-data`);
    } else {
      failed++;
      console.log(`FAIL | ${test.name} | HTTP ${response.status} | ${ms}ms | ${leak ? "SENSITIVE-DATA-LEAK" : "unexpected-status"}`);
      console.log(`      BODY: ${body.slice(0, 300).replace(/\s+/g, " ")}`);
    }
  } catch (error) {
    failed++;
    console.log(`FAIL | ${test.name} | NETWORK ${error.message}`);
  }
}

console.log(`RESULT | passed=${passed} failed=${failed} total=${tests.length}`);
process.exit(failed === 0 ? 0 : 1);
