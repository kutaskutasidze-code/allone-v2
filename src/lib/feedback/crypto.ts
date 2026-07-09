import crypto from "crypto";
import { feedbackConfig } from "./config";

// AES-256-GCM. Key must be exactly 32 bytes (64 hex chars).
function key(): Buffer {
  const k = Buffer.from(feedbackConfig.encKey, "hex");
  if (k.length !== 32) {
    throw new Error("APP_ENCRYPTION_KEY must be 32 bytes (64 hex chars)");
  }
  return k;
}

// Encoding: base64( iv[12] || authTag[16] || ciphertext ).
export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt(payload: string): string {
  const raw = Buffer.from(payload, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const enc = raw.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

export function sha256hex(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

// 256-bit url-safe magic-link token.
export function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

// ~16-char url-safe password.
export function generatePassword(): string {
  return crypto.randomBytes(12).toString("base64url");
}

export function slugify(name: string): string {
  const s = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return s || "client";
}
