import pool from "../../lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT * FROM personnel ORDER BY id DESC"
    );

    return Response.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Personnel GET error:", error);

    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      full_name,
      national_id,
      personnel_code,
      department,
      job_title,
    } = body;

    if (!full_name) {
      return Response.json(
        {
          success: false,
          error: "نام کارمند الزامی است.",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO personnel
       (
         full_name,
         national_id,
         personnel_code,
         department,
         job_title
       )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        full_name,
        national_id || "",
        personnel_code || "",
        department || "",
        job_title || "",
      ]
    );

    return Response.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Personnel POST error:", error);

    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}