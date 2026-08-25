import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const { default: pool } = await import("./app/lib/db.js");

async function main() {
  try {
    console.log("شروع بررسی ساختار شرکت‌ها...");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ جدول companies آماده است.");

    await pool.query(`
      ALTER TABLE personnel
      ADD COLUMN IF NOT EXISTS company_id INTEGER;
    `);

    console.log("✅ ستون company_id در personnel آماده است.");

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'personnel_company_id_fkey'
        ) THEN
          ALTER TABLE personnel
          ADD CONSTRAINT personnel_company_id_fkey
          FOREIGN KEY (company_id)
          REFERENCES companies(id)
          ON DELETE RESTRICT;
        END IF;
      END
      $$;
    `);

    console.log("✅ ارتباط کارکنان با شرکت‌ها ایجاد شد.");

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_personnel_company_id
      ON personnel(company_id);
    `);

    console.log("✅ ایندکس company_id ایجاد شد.");

    const companies = await pool.query(`
      SELECT id, name, created_at
      FROM companies
      ORDER BY id DESC;
    `);

    const personnel = await pool.query(`
      SELECT id, full_name, company_id
      FROM personnel
      ORDER BY id;
    `);

    console.log("\n--- شرکت‌ها ---");
    console.table(companies.rows);

    console.log("\n--- کارکنان ---");
    console.table(personnel.rows);

    console.log("\n🎉 ساختار چندشرکتی آماده است.");
    console.log("ℹ️ هیچ کارمندی حذف نشده است.");
  } catch (error) {
    console.error("\n❌ خطا:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();