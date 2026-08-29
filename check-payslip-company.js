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
        p.id,
        p.personnel_id,
        p.year,
        p.month,
        p.net_salary,
        pe.full_name,
        pe.company_id,
        co.name AS company_name
      FROM payslips p
      LEFT JOIN personnel pe
        ON pe.id = p.personnel_id
      LEFT JOIN companies co
        ON co.id = pe.company_id
      ORDER BY p.id DESC;
    `);

    console.table(result.rows);
  } catch (error) {
    console.error("❌ ERROR:", error.message);
  } finally {
    await client.end();
  }
}

main();