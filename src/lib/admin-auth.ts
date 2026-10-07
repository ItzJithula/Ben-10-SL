import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Single-admin session handling.
 *
 * Set these in .env.local before putting the site online:
 *   ADMIN_USERNAME  (optional, informational)
 *   ADMIN_PASSWORD  (default: ben10admin)
 *   ADMIN_SESSION_SECRET (signing key for the session cookie)
 */

export const SESSION_COOKIE = "b10_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function adminUsername(): string {
  return process.env.ADMIN_USERNAME ?? "admin";
}

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "ben10admin";
}

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? "ben10-sl-dev-secret-change-me";
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
  return safeEqual(username.trim(), adminUsername()) && safeEqual(password, adminPassword());
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
