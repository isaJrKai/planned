import { randomBytes, scryptSync, timingSafeEqual, createHash, createCipheriv, createDecipheriv } from "crypto";

const configuredSecret = process.env.APP_SECRET;
const isProduction = process.env.NODE_ENV === "production";

// APP_SECRET is independent from database credentials and must be stable across
// deployments. Production must never fall back to a predictable development key.
if (isProduction && (!configuredSecret || configuredSecret.length < 32)) {
  throw new Error("APP_SECRET is required in production and must be at least 32 characters.");
}

const SECRET = configuredSecret ?? "planned-local-development-secret-only";

// Older deployments may have encrypted provider keys using DATABASE_URL as the
// fallback key. Keep a read-only fallback so those values can be re-encrypted
// after APP_SECRET is configured. New values are always encrypted with APP_SECRET.
const LEGACY_SECRET =
  process.env.DATABASE_URL && process.env.DATABASE_URL !== configuredSecret
    ? process.env.DATABASE_URL
    : null;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [algo, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

function key(secret: string) {
  return createHash("sha256").update(secret).digest();
}

function decryptWithSecret(payload: string, secret: string): string {
  const [iv, tag, data] = payload.split(".");
  if (!iv || !tag || data === undefined) throw new Error("Invalid encrypted secret payload");
  const decipher = createDecipheriv("aes-256-gcm", key(secret), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
}

export function encryptSecret(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(SECRET), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64url"), tag.toString("base64url"), enc.toString("base64url")].join(".");
}

export function decryptSecret(payload: string): string | null {
  try {
    return decryptWithSecret(payload, SECRET);
  } catch {
    if (!LEGACY_SECRET) return null;
    try {
      return decryptWithSecret(payload, LEGACY_SECRET);
    } catch {
      return null;
    }
  }
}

export function maskKey(k: string) {
  if (k.length <= 8) return "••••";
  return `${k.slice(0, 4)}…${k.slice(-4)}`;
}
