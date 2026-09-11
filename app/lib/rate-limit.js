import crypto from "crypto";
import pool from "./db";

const TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS auth_rate_limits (
    scope VARCHAR(80) NOT NULL,
    key_hash VARCHAR(64) NOT NULL,
    window_started_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    blocked_until TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (scope, key_hash)
  )
`;

let tableReady = false;
let tablePromise = null;

async function ensureTable() {
  if (tableReady) return;
  if (!tablePromise) {
    tablePromise = pool.query(TABLE_SQL).then(() => {
      tableReady = true;
    }).finally(() => {
      tablePromise = null;
    });
  }
  await tablePromise;
}

function hashKey(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

function nowPlus(ms) {
  return new Date(Date.now() + ms);
}

export function getRequestIp(request) {
  const forwarded = request?.headers?.get("x-forwarded-for") || request?.headers?.get("x-real-ip") || "unknown";
  return String(forwarded).split(",")[0].trim() || "unknown";
}

export async function checkRateLimit({ scope, key, maxAttempts, windowMs, blockMs = windowMs }) {
  await ensureTable();
  const normalizedScope = String(scope || "unknown").slice(0, 80);
  const keyHash = hashKey(normalizeKey(key));
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `SELECT window_started_at, attempts, blocked_until
       FROM auth_rate_limits
       WHERE scope=$1 AND key_hash=$2
       FOR UPDATE`,
      [normalizedScope, keyHash]
    );
    const now = Date.now();
    let attempts = 0;
    let windowStarted = new Date(now);
    let blockedUntil = null;

    if (result.rows.length) {
      const row = result.rows[0];
      windowStarted = new Date(row.window_started_at);
      attempts = Number(row.attempts || 0);
      blockedUntil = row.blocked_until ? new Date(row.blocked_until) : null;
      if (blockedUntil && blockedUntil.getTime() > now) {
        await client.query("ROLLBACK");
        return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((blockedUntil.getTime() - now) / 1000)), attempts };
      }
      if (windowStarted.getTime() + windowMs <= now) {
        windowStarted = new Date(now);
        attempts = 0;
        blockedUntil = null;
      }
    }

    attempts += 1;
    if (attempts > maxAttempts) {
      blockedUntil = nowPlus(blockMs);
      await client.query(
        `INSERT INTO auth_rate_limits (scope,key_hash,window_started_at,attempts,blocked_until,updated_at)
         VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP)
         ON CONFLICT (scope,key_hash) DO UPDATE SET
           window_started_at=EXCLUDED.window_started_at,
           attempts=EXCLUDED.attempts,
           blocked_until=EXCLUDED.blocked_until,
           updated_at=CURRENT_TIMESTAMP`,
        [normalizedScope, keyHash, windowStarted, attempts, blockedUntil]
      );
      await client.query("COMMIT");
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(blockMs / 1000)), attempts };
    }

    await client.query(
      `INSERT INTO auth_rate_limits (scope,key_hash,window_started_at,attempts,blocked_until,updated_at)
       VALUES ($1,$2,$3,$4,NULL,CURRENT_TIMESTAMP)
       ON CONFLICT (scope,key_hash) DO UPDATE SET
         window_started_at=EXCLUDED.window_started_at,
         attempts=EXCLUDED.attempts,
         blocked_until=NULL,
         updated_at=CURRENT_TIMESTAMP`,
      [normalizedScope, keyHash, windowStarted, attempts]
    );
    await client.query("COMMIT");
    return { allowed: true, retryAfterSeconds: 0, attempts };
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    throw error;
  } finally {
    client.release();
  }
}

export async function clearRateLimit({ scope, key }) {
  try {
    await ensureTable();
    await pool.query("DELETE FROM auth_rate_limits WHERE scope=$1 AND key_hash=$2", [String(scope || "unknown").slice(0, 80), hashKey(normalizeKey(key))]);
  } catch (error) {
    console.error("RATE LIMIT CLEAR ERROR:", error?.message || error);
  }
}
