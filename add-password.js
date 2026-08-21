import pool from "./app/lib/db.js";

async function addPasswordColumn() {
  try {
    console.log("در حال اتصال به دیتابیس...");

    await pool.query(`
      ALTER TABLE personnel
      ADD COLUMN IF NOT EXISTS payslip_password VARCHAR(100);
    `);

    console.log("ستون payslip_password با موفقیت ساخته شد.");

    const result = await pool.query(`
      SELECT id, full_name, national_id, payslip_password
      FROM personnel
      ORDER BY id DESC;
    `);

    console.log("پرسنل موجود:");

    console.table(result.rows);

  } catch (error) {
    console.error("خطا:");
    console.error(error.message);
  } finally {
    await pool.end();
  }
}

addPasswordColumn();