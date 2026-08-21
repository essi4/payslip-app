import pool from "./app/lib/db.js";

async function setPassword() {
  try {
    console.log("در حال اتصال به دیتابیس...");

    await pool.query(
      `
      UPDATE personnel
      SET payslip_password = $1
      WHERE national_id = $2
      `,
      ["1234", "1234567890"]
    );

    console.log("رمز با موفقیت تنظیم شد.");

    const result = await pool.query(
      `
      SELECT
        id,
        full_name,
        national_id,
        payslip_password
      FROM personnel
      WHERE national_id = $1
      `,
      ["1234567890"]
    );

    console.table(result.rows);

  } catch (error) {
    console.error("خطای کامل:");
    console.error(error);
  } finally {
    await pool.end();
  }
}

setPassword();