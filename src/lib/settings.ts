import { FALLBACK_LOGO_URL, query, queryOne, transaction } from "./db";

/** Tiny key/value settings store — everything is editable from the admin panel. */

export type SiteSettings = Record<string, string>;

export const DEFAULT_SETTINGS: SiteSettings = {
  site_name: "Ben 10 SL",
  site_tagline: "Sinhala Dubbed Episodes",
  site_description:
    "Every Ben 10 episode and movie, fully dubbed in Sinhala. Free to stream and download, organised by series.",
  logo_url: FALLBACK_LOGO_URL,
  logo_text: "Ben 10 SL",
  announcement: "🎬 New this week — every Ben 10 movie is now streaming with Sinhala audio!",
  hero_kicker: "100% Sinhala Dub",
  hero_title: "Every Ben 10 Series in Sinhala",
  hero_subtitle:
    "From Classic to Omniverse — every episode and movie, fully dubbed in Sinhala and free to watch.",
  hero_image: "https://i.ibb.co/99p93Zfc/file-66.jpg",
  featured_youtube: "",
  telegram_url: "https://t.me/ben10sl",
  telegram_requests: "https://t.me/ben10sl",
  contact_email: "hello@ben10sl.lk",
  footer_note: "a non-official fan page run by fans, for fans.",
  disclaimer:
    "No video files are stored on this website. Every link points to an external service or a Telegram channel. All characters and series titles belong to Cartoon Network and the respective rights holders.",
  telegram_members: "12,400",
  releases_label: "releases",
  site_online_since: "2023-01-15",
};

export async function getSettings(): Promise<SiteSettings> {
  try {
    const rows = await query<{ key: string; value: string }>("SELECT key, value FROM settings");
    const result: SiteSettings = { ...DEFAULT_SETTINGS };
    for (const row of rows) result[row.key] = row.value;
    return result;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function getSetting(key: string, fallback = ""): Promise<string> {
  try {
    const row = await queryOne<{ value: string }>("SELECT value FROM settings WHERE key = $1", [key]);
    return row?.value ?? (DEFAULT_SETTINGS[key] ?? fallback);
  } catch {
    return DEFAULT_SETTINGS[key] ?? fallback;
  }
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
