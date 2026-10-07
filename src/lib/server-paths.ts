import fs from "node:fs";
import path from "node:path";

/**
 * Server-only path helpers (node:fs / node:path).
 * Kept apart from `utils.ts` so client components never pull in node built-ins.
 */

export function dataDir(): string {
  return process.env.DATA_DIR ?? path.join(process.cwd(), "data");
}

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}
