import crypto from "crypto";

const COOKIE_NAME = "employee_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function getSessionSecret() {
  const secret = process.env.EMPLOYEE_SESSION_SECRET?.trim() || process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("EMPLOYEE_SESSION_SECRET or ADMIN_SESSION_SECRET must be configured and at least 32 characters long.");
  }
  return secret;
}

function sign(value) {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function createToken(employeeId) {
  const payload = Buffer.from(JSON.stringify({ sub: "employee", employeeId: Number(employeeId), exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token) {
  if (!token || typeof token !== "string") return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (data?.sub !== "employee" || !Number.isInteger(data.employeeId) || data.employeeId < 1) return null;
    if (!Number.isFinite(data.exp) || data.exp <= Math.floor(Date.now() / 1000)) return null;
    return { employeeId: data.employeeId };
  } catch {
    return null;
  }
}

export function createEmployeeSession(response, employeeId) {
  response.cookies.set(COOKIE_NAME, createToken(employeeId), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearEmployeeSession(response) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export function getEmployeeSession(request) {
  try {
    return verifyToken(request.cookies.get(COOKIE_NAME)?.value);
  } catch {
    return null;
  }
}
