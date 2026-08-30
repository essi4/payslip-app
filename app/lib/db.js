import pg from "pg";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

// Never allow a local PostgreSQL address in a deployed environment.
if (
  process.env.NODE_ENV === "production" &&
  /(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?/i.test(databaseUrl)
) {
  throw new Error("Production DATABASE_URL is pointing to a local database.");
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

export default pool;
