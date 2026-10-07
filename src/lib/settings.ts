import { getDb } from "./db";

/** Tiny key/value settings store — everything is editable from the admin panel. */

export type SiteSettings = Record<string, string>;

export function getSettings(): SiteSettings {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM settings").all() as {
    key: string;
    value: string;
  }[];
  const result: SiteSettings = {};
  for (const row of rows) result[row.key] = row.value;
  return result;
}

export function getSetting(key: string, fallback = ""): string {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? fallback;
}

export function updateSettings(patch: Record<string, string>): void {
  const db = getDb();
  const statement = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  );
  const run = db.transaction(() => {
    for (const [key, value] of Object.entries(patch)) statement.run(key, value);
  });
  run();
}
