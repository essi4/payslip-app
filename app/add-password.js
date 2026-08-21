import pool from "./app/lib/db.js";

async function addPasswordColumn() {
  try {
    console.log("=================================");
    console.log("در حال اتصال به دیتابیس...");
    console.log("=================================");

    await pool.query(`
      ALTER TABLE personnel
      ADD COLUMN IF NOT EXISTS payslip_password VARCHAR(100);
    `);

    console.log("");
    console.log("ستون payslip_password با موفقیت ساخته شد.");
    console.log("");

    const result = await pool.query(`
      SELECT
        id,
        full_name,
        national_id,
        payslip_password
      FROM personnel
      ORDER BY id DESC;
    `);

    console.log("پرسنل موجود:");
    console.table(result.rows);

    console.log("");
    console.log("عملیات با موفقیت انجام شد.");
    console.log("");

  } catch (error) {
    console.log("");
    console.log("=================================");
    console.log("خطای کامل دیتابیس");
    console.log("=================================");
    console.error(error);
    console.log("=================================");

  } finally {
    await pool.end();
  }
}

addPasswordColumn();