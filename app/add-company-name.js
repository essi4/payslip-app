import pool from "./app/lib/db.js";

async function main() {
  try {
    await pool.query(`
      ALTER TABLE personnel
      ADD COLUMN IF NOT EXISTS company_name VARCHAR(200);
    `);

    console.log("✅ ستون company_name با موفقیت ساخته شد.");
  } catch (error) {
    console.error("❌ خطا:", error.message);
  } finally {
    await pool.end();
  }
}

main();