import pool from "./app/lib/db.js";

async function checkColumns() {
  try {
    console.log("در حال اتصال به دیتابیس...");

    const result = await pool.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'personnel'
      ORDER BY ordinal_position;
    `);

    console.log("");
    console.log("======================================");
    console.log("PERSONNEL TABLE COLUMNS");
    console.log("======================================");

    if (result.rows.length === 0) {
      console.log("هیچ جدولی با نام personnel پیدا نشد.");
    } else {
      console.table(result.rows);
    }

    console.log("======================================");
  } catch (error) {
    console.log("");
    console.log("======================================");
    console.log("DATABASE ERROR");
    console.log("======================================");
    console.log("message:", error.message);
    console.log("code:", error.code);
    console.log("detail:", error.detail);
    console.log("hint:", error.hint);
    console.log("======================================");
  } finally {
    await pool.end();
  }
}

checkColumns();