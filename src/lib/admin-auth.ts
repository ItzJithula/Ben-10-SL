import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Single-admin session handling.
 *
 * Credentials live in the environment — never in the repository:
 *   ADMIN_USERNAME        (optional, default "admin")
 *   ADMIN_PASSWORD        password for the panel
 *   ADMIN_SESSION_SECRET  signing key for the session cookie (optional)
 *
 * Rules:
 *  - No password is ever hard-coded here. `ADMIN_PASSWORD` should be set in
 *    `.env.local` (gitignored) locally and in the host's env vars in production.
 *  - Production fails closed: without `ADMIN_PASSWORD` the panel stays locked.
 *  - Development stays usable: if no password is configured a temporary one is
 *    generated for the running process and printed to the server console.
 *  - When `ADMIN_SESSION_SECRET` is not set, a random per-process key is used
 *    (sessions then end when the server restarts).
 */

export const SESSION_COOKIE = "b10_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** Random fallback signing key, regenerated per process. */
const RUNTIME_SECRET = randomBytes(32).toString("hex");

let runtimePassword: string | null = null;
let warnedInProduction = false;

export function adminUsername(): string {
  return process.env.ADMIN_USERNAME?.trim() || "admin";
}

/** Returns the expected password, or null when the panel is locked. */
function adminPassword(): string | null {
  const configured = process.env.ADMIN_PASSWORD?.trim();
  if (configured) return configured;

  if (process.env.NODE_ENV === "production") {
    if (!warnedInProduction) {
      warnedInProduction = true;
      console.error(
        "[Ben 10 SL] ADMIN_PASSWORD is not set — the admin panel is locked in production. " +
          "Set ADMIN_PASSWORD (and ADMIN_SESSION_SECRET) in your environment to enable it.",
      );
    }
    return null;
  }

  if (!runtimePassword) {
    runtimePassword = randomBytes(12).toString("base64url");
    console.warn(
      "\n[Ben 10 SL] ADMIN_PASSWORD is not set.\n" +
        `             Temporary admin password for this dev session: ${runtimePassword}\n` +
        "             Add ADMIN_PASSWORD=… to .env.local to choose your own.\n",
    );
  }
  return runtimePassword;
}

/** True when the panel is unlocked (a password is configured or generated). */
export function adminPanelEnabled(): boolean {
  return adminPassword() !== null;
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
