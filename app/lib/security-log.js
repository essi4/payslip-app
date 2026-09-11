import pool from "./db";

export async function logSecurityEvent({ employeeId = null, event, request = null, success = true, details = null } = {}) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS security_events (
        id BIGSERIAL PRIMARY KEY,
        employee_id INTEGER,
        event VARCHAR(80) NOT NULL,
        success BOOLEAN NOT NULL DEFAULT TRUE,
        ip_address VARCHAR(120),
        user_agent TEXT,
        details JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const forwarded = request?.headers?.get("x-forwarded-for") || request?.headers?.get("x-real-ip") || null;
    const ip = forwarded ? String(forwarded).split(",")[0].trim() : null;
    const userAgent = request?.headers?.get("user-agent") || null;
    await pool.query(
      `INSERT INTO security_events (employee_id, event, success, ip_address, user_agent, details) VALUES ($1,$2,$3,$4,$5,$6)`,
      [employeeId, event, Boolean(success), ip, userAgent, details ? JSON.stringify(details) : null]
    );
  } catch (error) {
    console.error("SECURITY LOG ERROR:", error?.message || error);
  }
}
