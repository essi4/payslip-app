export function isAdminAuthenticated(request) {
  return request.cookies.get("admin_logged_in")?.value === "true";
}

export function requireAdmin(request) {
  if (isAdminAuthenticated(request)) {
    return null;
  }

  return Response.json(
    {
      success: false,
      error: "دسترسی غیرمجاز است.",
    },
    { status: 401 }
  );
}
