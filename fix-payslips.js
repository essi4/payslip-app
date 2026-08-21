import pool from "./app/lib/db.js";

async function fixPayslips() {
  try {
    console.log("Connecting to database...");

    const connection = await pool.query(
      "SELECT current_database() AS database, current_user AS username"
    );

    console.log("Database:", connection.rows[0].database);
    console.log("User:", connection.rows[0].username);

    console.log("Checking payslips table...");

    await pool.query(`
      ALTER TABLE payslips
      ADD COLUMN IF NOT EXISTS overtime NUMERIC DEFAULT 0
    `);

    await pool.query(`
      ALTER TABLE payslips
      ADD COLUMN IF NOT EXISTS bonus NUMERIC DEFAULT 0
    `);

    await pool.query(`
      ALTER TABLE payslips
      ADD COLUMN IF NOT EXISTS insurance NUMERIC DEFAULT 0
    `);

    await pool.query(`
      ALTER TABLE payslips
      ADD COLUMN IF NOT EXISTS tax NUMERIC DEFAULT 0
    `);

    await pool.query(`
      ALTER TABLE payslips
      ADD COLUMN IF NOT EXISTS net_salary NUMERIC DEFAULT 0
    `);

    console.log("SUCCESS: payslips columns updated.");

    const columns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'payslips'
      ORDER BY ordinal_position
    `);

    console.log("Current payslips columns:");

    columns.rows.forEach((row) => {
      console.log("-", row.column_name);
    });

  } catch (error) {
    console.error("DATABASE ERROR");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Detail:", error.detail);
    console.error("Hint:", error.hint);
  } finally {
    await pool.end();
  }
}

fixPayslips();