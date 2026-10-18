import os from "node:os";
import path from "node:path";

/**
 * Server-only path helpers (node:path).
 * Kept apart from `utils.ts` so client components never pull in node built-ins.
 */

/**
 * Directory used by the embedded local database (./data/pglite) when no
 * `DATABASE_URL` is configured. Override with `DATA_DIR`.
 * On serverless environments (such as Vercel), writes to /tmp because root is read-only.
 */
export function dataDir(): string {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join(os.tmpdir(), "ben10sl-data");
  }
  return path.join(process.cwd(), "data");
}
