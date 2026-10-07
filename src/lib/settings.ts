import { query, queryOne, transaction } from "./db";

/** Tiny key/value settings store — everything is editable from the admin panel. */

export type SiteSettings = Record<string, string>;

export async function getSettings(): Promise<SiteSettings> {
  const rows = await query<{ key: string; value: string }>("SELECT key, value FROM settings");
  const result: SiteSettings = {};
  for (const row of rows) result[row.key] = row.value;
  return result;
}

export async function getSetting(key: string, fallback = ""): Promise<string> {
  const row = await queryOne<{ value: string }>("SELECT value FROM settings WHERE key = $1", [key]);
  return row?.value ?? fallback;
}

export async function updateSettings(patch: Record<string, string>): Promise<void> {
  await transaction(
    Object.entries(patch).map(([key, value]) => ({
      text: `INSERT INTO settings (key, value) VALUES ($1, $2)
             ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
      params: [key, value],
    })),
  );
}
