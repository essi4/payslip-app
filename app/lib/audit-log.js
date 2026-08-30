import pool from "./db.js";

export async function writeAuditLog({ action, entityType, entityId = null, payrollPeriodId = null, details = {} }) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (action, entity_type, entity_id, payroll_period_id, details)
       VALUES ($1,$2,$3,$4,$5::jsonb)`,
      [action, entityType, entityId, payrollPeriodId, JSON.stringify(details)]
    );
  } catch (error) {
    console.error("Audit log error:", error);
  }
}
