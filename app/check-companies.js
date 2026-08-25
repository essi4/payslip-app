import pool from "./app/lib/db.js";

async function main() {
  try {
    console.log("--- بررسی جدول‌های دیتابیس ---");

    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log("TABLES:");
    console.table(tables.rows);

    const companies = await pool.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'companies'
      ) AS exists
    `);

    console.log("companies table:", companies.rows[0]);

    const personnelColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'personnel'
      ORDER BY ordinal_position
    `);

    console.log("personnel columns:");
    console.table(personnelColumns.rows);

  } catch (error) {
    console.error("DATABASE CHECK ERROR:");
    console.error(error);
  } finally {
    await pool.end();
  }
}

main();