import crypto from "crypto";
import { promisify } from "util";

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };

export async function hashPassword(password) {
  const value = String(password ?? "");
  if (!value) throw new Error("Password cannot be empty.");
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await scrypt(value, salt, KEY_LENGTH, SCRYPT_OPTIONS);
  return `scrypt$${salt}$${Buffer.from(derived).toString("hex")}`;
}

export async function verifyPassword(password, storedPassword) {
  const value = String(password ?? "");
  const stored = String(storedPassword ?? "");
  if (!value || !stored) return { valid: false, needsUpgrade: false };

  if (!stored.startsWith("scrypt$")) {
    return { valid: crypto.timingSafeEqual(Buffer.from(value), Buffer.from(stored)), needsUpgrade: true };
  }

  const [, salt, expectedHex] = stored.split("$");
  if (!salt || !expectedHex || !/^[0-9a-f]+$/i.test(expectedHex)) {
    return { valid: false, needsUpgrade: false };
  }

  const expected = Buffer.from(expectedHex, "hex");
  if (expected.length !== KEY_LENGTH) return { valid: false, needsUpgrade: false };

  const derived = Buffer.from(await scrypt(value, salt, KEY_LENGTH, SCRYPT_OPTIONS));
  return { valid: crypto.timingSafeEqual(derived, expected), needsUpgrade: false };
}
