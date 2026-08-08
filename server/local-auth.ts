import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
function deriveKey(password: string, salt: Buffer, length: number, cost: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, length, { N: cost, r: 8, p: 1 }, (error, derived) => {
      if (error) reject(error);
      else resolve(derived as Buffer);
    });
  });
}

const PASSWORD_KEY_LENGTH = 64;
const MIN_PASSWORD_LENGTH = 12;

export type PasswordRecord = {
  algorithm: "scrypt";
  salt: string;
  hash: string;
  cost: number;
};

export function validateEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 320) {
    throw new Error("Invalid email address");
  }
  return normalized;
}

export function validatePassword(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (password.length > 128) {
    throw new Error("Password is too long");
  }
}

export async function hashPassword(password: string): Promise<string> {
  validatePassword(password);
  const salt = randomBytes(16);
  const derived = await deriveKey(password, salt, PASSWORD_KEY_LENGTH, 16384);
  const record: PasswordRecord = {
    algorithm: "scrypt",
    salt: salt.toString("base64url"),
    hash: derived.toString("base64url"),
    cost: 16384,
  };
  return JSON.stringify(record);
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  try {
    validatePassword(password);
    const record = JSON.parse(encoded) as PasswordRecord;
    if (record.algorithm !== "scrypt" || !record.salt || !record.hash || record.cost !== 16384) return false;
    const salt = Buffer.from(record.salt, "base64url");
    const expected = Buffer.from(record.hash, "base64url");
    if (expected.length !== PASSWORD_KEY_LENGTH) return false;
    const actual = await deriveKey(password, salt, expected.length, record.cost);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function createOneTimeToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function normalizeReturnPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/";
  }
  try {
    const url = new URL(value, "https://settleclt.com");
    if (url.origin !== "https://settleclt.com") return "/";
    return `${url.pathname}${url.search}`;
  } catch {
    return "/";
  }
}

export const LOCAL_AUTH_MIN_PASSWORD_LENGTH = MIN_PASSWORD_LENGTH;
