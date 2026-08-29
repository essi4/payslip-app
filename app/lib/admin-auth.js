import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function sign(payload) {
  return createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
}

export function createAdminSession() {
  const secret = getSecret();

  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not configured.");
  }

  const payload = base64url(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    })
  );

  return `${payload}.${sign(payload)}`;
}

export function isAdminAuthenticated(request) {
  const secret = getSecret();
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!secret || !token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload);

  try {
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return false;
    }

    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number.isFinite(data.exp) && data.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
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

export { COOKIE_NAME, SESSION_TTL_SECONDS };