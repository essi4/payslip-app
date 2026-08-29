import { requireAdmin } from "../../lib/admin-auth";

export async function GET(request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  return Response.json({
    success: false,
    error: "این مسیر تعمیر خودکار دیتابیس غیرفعال شده است. ساختار دیتابیس باید از طریق migration مدیریت شود.",
  }, { status: 410 });
}