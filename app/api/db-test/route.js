import pool from "@/app/lib/db";

export async function GET() {
  try {
    const result = await pool.query("SELECT NOW()");

    return Response.json({
      success: true,
      message: "اتصال به دیتابیس موفق بود",
      time: result.rows[0],
    });
  } catch (error) {
    console.error("Database error:", error);

    return Response.json(
      {
        success: false,
        message: "اتصال به دیتابیس برقرار نشد",
      },
      { status: 500 }
    );
  }
}