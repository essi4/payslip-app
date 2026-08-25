import { NextResponse } from "next/server";
import pool from "../../lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.created_at,
        COUNT(p.id)::int AS employee_count
      FROM companies c
      LEFT JOIN personnel p
        ON p.company_id = c.id
      GROUP BY
        c.id,
        c.name,
        c.created_at
      ORDER BY c.id DESC
    `);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("GET COMPANIES ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "خطا در دریافت شرکت‌ها",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const name = String(body.name || "").trim();

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "نام شرکت الزامی است.",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        INSERT INTO companies (name)
        VALUES ($1)
        RETURNING *
      `,
      [name]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("POST COMPANY ERROR:", error);

    if (error.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          error: "این شرکت قبلاً ثبت شده است.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "خطا در ثبت شرکت.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();

    const id = Number(body.id);
    const name = String(body.name || "").trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "شناسه شرکت نامعتبر است.",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "نام شرکت الزامی است.",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        UPDATE companies
        SET name = $1
        WHERE id = $2
        RETURNING *
      `,
      [name, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "شرکت پیدا نشد.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("PUT COMPANY ERROR:", error);

    if (error.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          error: "این نام شرکت قبلاً ثبت شده است.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "خطا در ویرایش شرکت.",
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
      return NextResponse.json(
        {
          success: false,
          error: "شناسه شرکت نامعتبر است.",
        },
        { status: 400 }
      );
    }

    const employeeCheck = await pool.query(
      `
        SELECT COUNT(*)::int AS count
        FROM personnel
        WHERE company_id = $1
      `,
      [id]
    );

    const employeeCount = employeeCheck.rows[0].count;

    if (employeeCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `این شرکت دارای ${employeeCount} کارمند است و فعلاً قابل حذف نیست.`,
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        DELETE FROM companies
        WHERE id = $1
        RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "شرکت پیدا نشد.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("DELETE COMPANY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "خطا در حذف شرکت.",
      },
      { status: 500 }
    );
  }
}
