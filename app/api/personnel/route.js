import pool from "@/app/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        national_id AS "nationalId",
        role,
        base_salary AS "baseSalary"
      FROM personnel
      ORDER BY id DESC
    `);

    return Response.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Personnel GET error:", error);

    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}