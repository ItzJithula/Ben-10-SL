import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Single-admin session handling.
 *
 * Credentials come from the environment:
 *   ADMIN_USERNAME        (optional, default "admin")
 *   ADMIN_PASSWORD        (REQUIRED in production — without it the panel stays locked)
 *   ADMIN_SESSION_SECRET  (optional; when unset a random per-process key is used,
 *                          which simply means sessions end when the server restarts)
 *
 * While developing locally (`npm run dev`) the panel accepts the documented
 * default password so a fresh clone is usable straight away. In production the
 * default is never accepted: fail closed instead of shipping a public password.
 */

export const SESSION_COOKIE = "b10_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** Local-development convenience only — never used when NODE_ENV=production. */
const DEV_DEFAULT_PASSWORD = ["ben10", "admin"].join("");

/** Random fallback key, regenerated per process. */
const RUNTIME_SECRET = randomBytes(32).toString("hex");

let warnedAboutPassword = false;

export function adminUsername(): string {
  return process.env.ADMIN_USERNAME?.trim() || "admin";
}

/** Returns the expected password, or null when the panel is disabled. */
function adminPassword(): string | null {
  const configured = process.env.ADMIN_PASSWORD?.trim();
  if (configured) return configured;

  if (process.env.NODE_ENV === "production") {
    if (!warnedAboutPassword) {
      warnedAboutPassword = true;
      console.error(
        "[Ben 10 SL] ADMIN_PASSWORD is not set — the admin panel is locked in production. " +
          "Set ADMIN_PASSWORD (and ADMIN_SESSION_SECRET) in your environment to enable it.",
      );
    }
    return null;
  }

  return DEV_DEFAULT_PASSWORD;
}

/** True when the panel is unlocked (a password is configured, or we are in dev). */
export function adminPanelEnabled(): boolean {
  return adminPassword() !== null;
}

/** True only while the built-in development password is in effect. */
export function usingDevDefaultPassword(): boolean {
  return !process.env.ADMIN_PASSWORD?.trim() && process.env.NODE_ENV !== "production";
}

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET?.trim() || RUNTIME_SECRET;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyCredentials(username: string, password: string): boolean {
  const expected = adminPassword();
  if (!expected) return false;
  return safeEqual(username.trim(), adminUsername()) && safeEqual(password, expected);
}

export function createSessionToken(): string {
  const payload = `${adminUsername()}.${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

export function isValidToken(token?: string | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [user, issued, signature] = parts;
  const payload = `${user}.${issued}`;
  if (!safeEqual(signature, sign(payload))) return false;
  const issuedAt = Number(issued);
  if (!Number.isFinite(issuedAt)) return false;
  return Date.now() - issuedAt < SESSION_MAX_AGE * 1000;
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return isValidToken(store.get(SESSION_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
  secure: process.env.NODE_ENV === "production",
};
