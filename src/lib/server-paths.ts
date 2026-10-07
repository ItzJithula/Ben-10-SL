import path from "node:path";

/**
 * Server-only path helpers (node:path).
 * Kept apart from `utils.ts` so client components never pull in node built-ins.
 */

/**
 * Directory used by the embedded local database (./data/pglite) when no
 * `DATABASE_URL` is configured. Override with `DATA_DIR`.
 */
export function dataDir(): string {
  return process.env.DATA_DIR ?? path.join(process.cwd(), "data");
}
