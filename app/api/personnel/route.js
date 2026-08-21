import pool from "../../lib/db";

async function ensurePersonnelColumns() {
  await pool.query(`
    ALTER TABLE personnel
    ADD COLUMN IF NOT EXISTS bank_account VARCHAR(50),
    ADD COLUMN IF NOT EXISTS job_group VARCHAR(100)
  `);
}

export async function GET() {
  try {
    await ensurePersonnelColumns();

    const result = await pool.query(
      "SELECT * FROM personnel ORDER BY id DESC"
    );

    return Response.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("GET PERSONNEL ERROR:", error);

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
    await ensurePersonnelColumns();

    const body = await request.json();

    const {
      full_name,
      national_id,
      personnel_code,
      bank_account,
      department,
      job_group,
      job_title,
    } = body;

    if (
      !full_name ||
      !national_id ||
      !personnel_code ||
      !department ||
      !job_title
    ) {
      return Response.json(
        {
          success: false,
          error: "لطفاً اطلاعات اصلی کارمند را کامل وارد کنید.",
        },
        { status: 400 }
      );
    }

    const queryText = `
      INSERT INTO personnel (
        full_name,
        national_id,
        personnel_code,
        bank_account,
        department,
        job_group,
        job_title
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      full_name,
      national_id,
      personnel_code,
      bank_account || "",
      department,
      job_group || "",
      job_title,
    ];

    const result = await pool.query(queryText, values);

    return Response.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("POST PERSONNEL ERROR:", error);

    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await ensurePersonnelColumns();

    const body = await request.json();

    const {
      id,
      full_name,
      national_id,
      personnel_code,
      bank_account,
      department,
      job_group,
      job_title,
    } = body;

    if (!id) {
      return Response.json(
        {
          success: false,
          error: "شناسه کارمند ارسال نشده است.",
        },
        { status: 400 }
      );
    }

    const queryText = `
      UPDATE personnel
      SET
        full_name = $1,
        national_id = $2,
        personnel_code = $3,
        bank_account = $4,
        department = $5,
        job_group = $6,
        job_title = $7
      WHERE id = $8
      RETURNING *
    `;

    const values = [
      full_name,
      national_id,
      personnel_code,
      bank_account || "",
      department,
      job_group || "",
      job_title,
      id,
    ];

    const result = await pool.query(queryText, values);

    if (result.rows.length === 0) {
      return Response.json(
        {
          success: false,
          error: "کارمند موردنظر پیدا نشد.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("PUT PERSONNEL ERROR:", error);

    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();

    const { id } = body;

    if (!id) {
      return Response.json(
        {
          success: false,
          error: "شناسه کارمند ارسال نشده است.",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      "DELETE FROM personnel WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return Response.json(
        {
          success: false,
          error: "کارمند موردنظر پیدا نشد.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("DELETE PERSONNEL ERROR:", error);

    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}