import fs from "fs";
import path from "path";
import { Pool } from "pg";

const envPath = path.join(process.cwd(), ".env.local");

if (!fs.existsSync(envPath)) {
  throw new Error(".env.local پیدا نشد.");
}

const envText = fs.readFileSync(envPath, "utf8");

for (const line of envText.split(/\r?\n/)) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("#")) {
    continue;
  }

  const index = trimmed.indexOf("=");

  if (index === -1) {
    continue;
  }

  const key = trimmed.slice(0, index).trim();
  let value = trimmed.slice(index + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  process.env[key] = value;
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL در .env.local پیدا نشد.");
}

console.log("🔗 اتصال به دیتابیس همروش...");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function main() {
  try {
    await pool.query("SELECT NOW()");

    console.log("✅ اتصال به دیتابیس برقرار شد.");

    await pool.query(`
      ALTER TABLE personnel
      ADD COLUMN IF NOT EXISTS email VARCHAR(255);

      ALTER TABLE personnel
      ADD COLUMN IF NOT EXISTS password_reset_code VARCHAR(10);

      ALTER TABLE personnel
      ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP;
    `);

    console.log(
      "✅ ستون‌های ایمیل و بازیابی رمز با موفقیت ساخته شدند."
    );
  } catch (error) {
    console.error("❌ Database setup error:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
