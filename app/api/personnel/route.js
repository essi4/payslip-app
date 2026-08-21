import pool from "../../lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        id,
        full_name,
        national_id,
        personnel_code,
        department,
        job_title,
        bank_account,
        job_group,
        payslip_password,
        created_at
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
        error: error.message || "خطا در دریافت کارکنان",
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
      bank_account,
      job_group,
      payslip_password,
    } = body;

    const result = await pool.query(
      `
      INSERT INTO personnel (
        full_name,
        national_id,
        personnel_code,
        department,
        job_title,
        bank_account,
        job_group,
        payslip_password
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        full_name || null,
        national_id || null,
        personnel_code || null,
        department || null,
        job_title || null,
        bank_account || null,
        job_group || null,
        payslip_password || null,
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
        error: error.message || "خطا در ثبت کارمند",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();

    const id = Number(body.id);

    if (!id) {
      return Response.json(
        {
          success: false,
          error: "شناسه کارمند نامعتبر است.",
        },
        { status: 400 }
      );
    }

    const {
      full_name,
      national_id,
      personnel_code,
      department,
      job_title,
      bank_account,
      job_group,
      payslip_password,
    } = body;

    const result = await pool.query(
      `
      UPDATE personnel
      SET
        full_name = $1,
        national_id = $2,
        personnel_code = $3,
        department = $4,
        job_title = $5,
        bank_account = $6,
        job_group = $7,
        payslip_password = $8
      WHERE id = $9
      RETURNING *
      `,
      [
        full_name || null,
        national_id || null,
        personnel_code || null,
        department || null,
        job_title || null,
        bank_account || null,
        job_group || null,
        payslip_password || null,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return Response.json(
        {
          success: false,
          error: "کارمند پیدا نشد.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Personnel PUT error:", error);

    return Response.json(
      {
        success: false,
        error: error.message || "خطا در ویرایش کارمند",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();

    const id = Number(body.id);

    if (!id) {
      return Response.json(
        {
          success: false,
          error: "شناسه کارمند نامعتبر است.",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      DELETE FROM personnel
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return Response.json(
        {
          success: false,
          error: "کارمند پیدا نشد.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "کارمند با موفقیت حذف شد.",
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error("Personnel DELETE error:", error);

    return Response.json(
      {
        success: false,
        error: error.message || "خطا در حذف کارمند",
      },
      { status: 500 }
    );
  }
}