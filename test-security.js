const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123456";

let passed = 0;
let failed = 0;

function pass(message) {
  passed++;
  console.log(`🟢 PASS: ${message}`);
}

function fail(message, detail = "") {
  failed++;
  console.log(`🔴 FAIL: ${message}`);
  if (detail) console.log(`   ${detail}`);
}

async function request(path, options = {}) {
  return fetch(`${BASE_URL}${path}`, {
    redirect: "manual",
    ...options,
  });
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function run() {
  console.log("\n======================================");
  console.log("🔐 تست خودکار امنیت پنل مدیریت");
  console.log("======================================");
  console.log(`🌐 ${BASE_URL}\n`);

  let cookie = "";

  // 1) /admin بدون ورود
  try {
    const response = await request("/admin");
    if ([302, 303, 307, 308].includes(response.status)) {
      pass("دسترسی بدون ورود به /admin مسدود است.");
    } else {
      fail("دسترسی بدون ورود به /admin مسدود نشد.", `HTTP ${response.status}`);
    }
  } catch (error) {
    fail("تست /admin اجرا نشد.", error.message);
  }

  // 2) personnel بدون ورود
  try {
    const response = await request("/api/personnel");
    const data = await readJson(response);
    if (response.status === 401 && data.success === false) {
      pass("API کارکنان بدون ورود محافظت شده است.");
    } else {
      fail("API کارکنان بدون ورود محافظت نشده است.", `HTTP ${response.status}`);
    }
  } catch (error) {
    fail("تست API کارکنان اجرا نشد.", error.message);
  }

  // 3) payslips بدون ورود
  try {
    const response = await request("/api/payslips");
    const data = await readJson(response);
    if (response.status === 401 && data.success === false) {
      pass("API فیش‌ها بدون ورود محافظت شده است.");
    } else {
      fail("API فیش‌ها بدون ورود محافظت نشده است.", `HTTP ${response.status}`);
    }
  } catch (error) {
    fail("تست API فیش‌ها اجرا نشد.", error.message);
  }

  // 4) ورود صحیح
  try {
    const response = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
      }),
    });

    const data = await readJson(response);
    const setCookie = response.headers.get("set-cookie") || "";

    if (response.status === 200 && data.success === true && setCookie) {
      cookie = setCookie.split(";")[0];
      pass("ورود با نام کاربری و رمز صحیح موفق بود.");
    } else {
      fail("ورود با اطلاعات صحیح موفق نبود.", `HTTP ${response.status}`);
    }
  } catch (error) {
    fail("تست ورود موفق اجرا نشد.", error.message);
  }

  // 5) ورود اشتباه
  try {
    const response = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: ADMIN_USERNAME,
        password: "WRONG_PASSWORD_123456",
      }),
    });

    const data = await readJson(response);
    if (response.status === 401 && data.success === false) {
      pass("رمز عبور اشتباه به‌درستی رد شد.");
    } else {
      fail("رمز عبور اشتباه پذیرفته شد.", `HTTP ${response.status}`);
    }
  } catch (error) {
    fail("تست رمز اشتباه اجرا نشد.", error.message);
  }

  // 6) logout
  try {
    if (!cookie) {
      fail("Logout قابل تست نیست.", "ورود موفق انجام نشده است.");
    } else {
      const response = await request("/api/auth/logout", {
        method: "POST",
        headers: { Cookie: cookie },
      });

      const setCookie = response.headers.get("set-cookie") || "";
      const cleared =
        setCookie.includes("Max-Age=0") ||
        setCookie.includes("Expires=Thu, 01 Jan 1970");

      if (response.status >= 200 && response.status < 400 && cleared) {
        pass("Logout با موفقیت انجام شد.");
      } else {
        fail("Logout موفق نبود.", `HTTP ${response.status}`);
      }
    }
  } catch (error) {
    fail("تست Logout اجرا نشد.", error.message);
  }

  console.log("\n======================================");
  console.log("📊 نتیجه نهایی");
  console.log("======================================");
  console.log(`🟢 موفق: ${passed}`);
  console.log(`🔴 ناموفق: ${failed}`);
  console.log(`📌 مجموع: ${passed + failed}`);

  if (passed === 6 && failed === 0) {
    console.log("\n🟢🟢🟢 SECURITY TEST: 6/6 PASS 🟢🟢🟢");
    process.exit(0);
  }

  console.log("\n🔴 SECURITY TEST FAILED");
  process.exit(1);
}

run();
