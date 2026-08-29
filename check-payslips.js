require("dotenv").config({ path: ".env.local" });

const { Client } = require("pg");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function main() {
  try {
    await client.connect();

    console.log("✅ DB CONNECTED");

    const result = await client.query(`
      SELECT
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_name = 'payslips'
      ORDER BY ordinal_position;
    `);

    console.table(result.rows);
  } catch (error) {
    console.error("❌ ERROR:", error.message);
  } finally {
    await client.end();
  }
}

main();