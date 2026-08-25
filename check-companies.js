import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const { default: pool } = await import("./app/lib/db.js");

async function main() {
  try {
    console.log("Checking personnel structure...\n");

    const result = await pool.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'personnel'
      ORDER BY ordinal_position
    `);

    console.table(result.rows);
  } catch (error) {
    console.error("Database error:");
    console.error(error);
  } finally {
    await pool.end();
  }
}

main();