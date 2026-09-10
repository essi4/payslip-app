import pg from "pg";

const { Pool } = pg;

let pool;

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");
  if (
    process.env.NODE_ENV === "production" &&
    /(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?/i.test(databaseUrl)
  ) {
    throw new Error("Production DATABASE_URL is pointing to a local database.");
  }
  return databaseUrl;
}

function createPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    pool.on("error", (error) => {
      console.error("Unexpected PostgreSQL pool error:", error.message);
    });
  }
  return pool;
}

// Keep database configuration lazy so Next.js can build the application
// without contacting the database. Runtime API calls still fail explicitly
// when DATABASE_URL is missing or unsafe.
const db = new Proxy({}, {
  get(_target, property) {
    const database = createPool();
    const value = database[property];
    return typeof value === "function" ? value.bind(database) : value;
  },
});

export default db;
