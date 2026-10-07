import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import { dataDir } from "./server-paths";

/**
 * SQLite storage for Ben 10 SL.
 * The database lives in ./data/ben10sl.db and is created + seeded automatically
 * the first time the app boots, so a fresh clone just runs `npm run dev`.
 */

type DB = Database.Database;

const globalForDb = globalThis as unknown as { __ben10slDb?: DB };

export function getDb(): DB {
  if (globalForDb.__ben10slDb) return globalForDb.__ben10slDb;

  const dir = dataDir();
  fs.mkdirSync(dir, { recursive: true });
  const db = new Database(path.join(dir, "ben10sl.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  migrate(db);
  seed(db);

  globalForDb.__ben10slDb = db;
  return db;
}

function migrate(db: DB) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT NOT NULL,
      name_si      TEXT NOT NULL DEFAULT '',
      slug         TEXT NOT NULL UNIQUE,
      description  TEXT NOT NULL DEFAULT '',
      accent       TEXT NOT NULL DEFAULT '#39FF14',
      sort_order   INTEGER NOT NULL DEFAULT 0,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS releases (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id      INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      code             TEXT NOT NULL DEFAULT '',
      title            TEXT NOT NULL,
      title_en         TEXT NOT NULL DEFAULT '',
      slug             TEXT NOT NULL UNIQUE,
      season           INTEGER NOT NULL DEFAULT 1,
      episode_number   INTEGER,
      episode_type     TEXT NOT NULL DEFAULT 'episode',
      synopsis         TEXT NOT NULL DEFAULT '',
      thumbnail        TEXT NOT NULL DEFAULT '',
      quality          TEXT NOT NULL DEFAULT '720p',
      duration_minutes INTEGER NOT NULL DEFAULT 22,
      dubbed_studio    TEXT NOT NULL DEFAULT '',
      dubbed_date      TEXT NOT NULL DEFAULT '',
      aired_date       TEXT NOT NULL DEFAULT '',
      telegram_url     TEXT NOT NULL DEFAULT '',
      source           TEXT NOT NULL DEFAULT '',
      language         TEXT NOT NULL DEFAULT 'sinhala',
      tags             TEXT NOT NULL DEFAULT '',
      views            INTEGER NOT NULL DEFAULT 0,
      featured         INTEGER NOT NULL DEFAULT 0,
      status           TEXT NOT NULL DEFAULT 'published',
      created_at       TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS qualities (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      release_id    INTEGER NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
      label         TEXT NOT NULL,
      url           TEXT NOT NULL,
      file_size_mb  INTEGER,
      position      INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_releases_category ON releases(category_id);
    CREATE INDEX IF NOT EXISTS idx_releases_status   ON releases(status);
    CREATE INDEX IF NOT EXISTS idx_releases_type     ON releases(episode_type);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_releases_code ON releases(code) WHERE code <> '';
    CREATE INDEX IF NOT EXISTS idx_qualities_release ON qualities(release_id);
  `);
}

/* ------------------------------------------------------------------ */
/* Seed data — Sinhala dubbed Ben 10 releases                         */
/* ------------------------------------------------------------------ */

const CATEGORY_SEED = [
  {
    name: "Ben 10 Classic",
    name_si: "බෙන් 10 ක්ලැසික්",
    slug: "classic",
    description: "මුල් මාලාව — බෙන් ටෙනිසන් සහ ඔම්නිට්‍රික්ස්හි ආරම්භය.",
    accent: "#39FF14",
    sort_order: 1,
  },
  {
    name: "Alien Force",
    name_si: "එලියන් ෆෝස්",
    slug: "alien-force",
    description: "වසර 5කට පසු — නව එලියන් කණ්ඩායම සමඟ බෙන් නැවත පැමිණේ.",
    accent: "#00E5FF",
    sort_order: 2,
  },
  {
    name: "Ultimate Alien",
    name_si: "අල්ටිමේට් එලියන්",
    slug: "ultimate-alien",
    description: "අල්ටිමේට් රූපාන්තරණ සහ වඩාත් බරපතල සටන්.",
    accent: "#FF7A00",
    sort_order: 3,
  },
  {
    name: "Omniverse",
    name_si: "ඕම්නිවර්ස්",
    slug: "omniverse",
    description: "බහු විශ්ව ගමන් — නවීන පෙනුම සහ නව එලියන්ස්.",
    accent: "#B026FF",
    sort_order: 4,
  },
  {
    name: "Reboot",
    name_si: "රීබූට්",
    slug: "reboot",
    description: "2016 නව නිර්මාණය — සැහැල්ලු හා විනෝදජනක කථාංග.",
    accent: "#FFC400",
    sort_order: 5,
  },
  {
    name: "Movies & Specials",
    name_si: "චිත්‍රපට හා විශේෂ",
    slug: "movies-specials",
    description: "ටෙලි කථාංගවලට පිටින් පැමිණි සම්පූර්ණ දිග චිත්‍රපට හා විශේෂ නිකුතු.",
    accent: "#FF2E88",
    sort_order: 6,
  },
];

interface SeedRelease {
  category: string;
  code: string;
  title: string;
  title_en: string;
  season: number;
  episode_number: number | null;
  episode_type: "episode" | "movie" | "special" | "short";
  synopsis: string;
  thumbnail: string;
  quality: string;
  duration_minutes: number;
  dubbed_studio: string;
  dubbed_date: string;
  aired_date: string;
  tags: string;
  featured?: boolean;
  views: number;
  links: { label: string; url: string; size: number }[];
}

const ART = {
  classic: "/art/cover-classic.jpg",
  alienforce: "/art/cover-alienforce.jpg",
  ultimate: "/art/cover-ultimate.jpg",
  omniverse: "/art/cover-omniverse.jpg",
  reboot: "/art/cover-reboot.jpg",
  movies: "/art/cover-movies.jpg",
};

const STUDIO = "SL Dubbing Team";

const seedReleases: SeedRelease[] = [
  /* ---------------------------- Classic ---------------------------- */
  {
    category: "classic",
    code: "B10-CL-001",
    title: "එතන දහ දෙනෙක් හිටියා",
    title_en: "And Then There Were 10",
    season: 1,
    episode_number: 1,
    episode_type: "episode",
    synopsis:
      "ගිම්හාන නිවාඩුවට යාමට පෙර බෙන් ටෙනිසන්ට අහසින් වැටුණු අද්භූත ඔම්නිට්‍රික්ස් උපකරණය හමු වේ. එයින් ඔහුට එලියන් දහ දෙනෙකු බවට පත්විය හැකි බව දැනගන්නා ඔහුගේ ජීවිතය සදහටම වෙනස් වේ.",
    thumbnail: ART.classic,
    quality: "1080p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-02-11",
    aired_date: "2005-12-27",
    tags: "ආරම්භය,ඔම්නිට්‍රික්ස්,බෙන්,ග්වෙන්,කීවින්",
    featured: true,
    views: 48210,
    links: [
      { label: "1080p", url: "https://t.me/ben10sl/1", size: 742 },
      { label: "720p", url: "https://t.me/ben10sl/2", size: 428 },
      { label: "480p", url: "https://t.me/ben10sl/3", size: 214 },
    ],
  },
  {
    category: "classic",
    code: "B10-CL-002",
    title: "වොෂිංටන් බී.සී.",
    title_en: "Washington B.C.",
    season: 1,
    episode_number: 2,
    episode_type: "episode",
    synopsis:
      "අනාචාරයේ හා බියකරු විද්‍යාඥයෙකු වන ඩොක්ටර් ඇනිමෝ ගල්වලින් ප්‍රාග් ඓතිහාසික සත්තු නැවත ජීවත් කරවා නගරයට නිදහස් කරයි. ඔවුන් නැවතත් මුදා හරින්නට බෙන් ගත් තීරණය ගැන මුළු නගරයම කම්පා වේ.",
    thumbnail: ART.classic,
    quality: "1080p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-02-18",
    aired_date: "2006-01-14",
    tags: "ඇනිමෝ,සත්තු,ඩයිනෝසෝර",
    views: 31240,
    links: [
      { label: "1080p", url: "https://t.me/ben10sl/4", size: 738 },
      { label: "720p", url: "https://t.me/ben10sl/5", size: 421 },
    ],
  },
  {
    category: "classic",
    code: "B10-CL-003",
    title: "ක්‍රැකන්",
    title_en: "The Krakken",
    season: 1,
    episode_number: 3,
    episode_type: "episode",
    synopsis:
      "විලක් අසල නිවාඩුවක් ගත කරන අතරතුර ගැඹුරු ජලයේ සැඟවී සිටින යෝධ ජලජ නිවැසියෙක් ගැන බෙන් හා ග්වෙන් තොරතුරු සොයා යති.",
    thumbnail: ART.classic,
    quality: "720p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-02-25",
    aired_date: "2006-01-21",
    tags: "විල,ජලජ,රිප්ජෝස්",
    views: 27655,
    links: [
      { label: "720p", url: "https://t.me/ben10sl/6", size: 402 },
      { label: "480p", url: "https://t.me/ben10sl/7", size: 205 },
    ],
  },
  {
    category: "classic",
    code: "B10-CL-004",
    title: "සදාකාලික විශ්‍රාමය",
    title_en: "Permanent Retirement",
    season: 1,
    episode_number: 4,
    episode_type: "episode",
    synopsis:
      "මිත්‍රශීලී විශ්‍රාම ශාලාවක් යටතේ සැඟවුණු භයානක සැලසුමක් බෙන් හෙළිදරව් කරයි. ඔහුගේ මුතුන් මිත්තන්ට ද අවදානමක් එල්ල වේ.",
    thumbnail: ART.classic,
    quality: "720p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-03-03",
    aired_date: "2006-01-28",
    tags: "විශ්‍රාම,රහස්,ෆිල්",
    views: 25110,
    links: [{ label: "720p", url: "https://t.me/ben10sl/8", size: 398 }],
  },
  {
    category: "classic",
    code: "B10-CL-005",
    title: "දඩයම",
    title_en: "Hunted",
    season: 1,
    episode_number: 5,
    episode_type: "episode",
    synopsis:
      "ඔම්නිට්‍රික්ස් සොරාගැනීමට බඳවා ගත් සොරුන් තිදෙනකු බෙන් පසුපස එන අතර, ඔහුගේ රහස රැකගැනීම සඳහා කුමක් කළ යුතුද යන්න තීරණය කිරීමට බෙන්ට සිදුවේ.",
    thumbnail: ART.classic,
    quality: "720p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-03-10",
    aired_date: "2006-02-04",
    tags: "සොරු,කීවින්,සටන්",
    views: 24398,
    links: [{ label: "720p", url: "https://t.me/ben10sl/9", size: 405 }],
  },
  {
    category: "classic",
    code: "B10-CL-006",
    title: "කෙවින් 11",
    title_en: "Kevin 11",
    season: 1,
    episode_number: 5,
    episode_type: "episode",
    synopsis:
      "බෙන්ගේ ශක්තිය උරාගත් කෙවින් නැවත පැමිණේ. ඔහුගේ ප්‍රහාරවලට එරෙහිව නගරය බේරා ගැනීමට බෙන් උපරිම උත්සාහයක් ගනී.",
    thumbnail: ART.classic,
    quality: "1080p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-03-17",
    aired_date: "2006-08-26",
    tags: "කෙවින්,පළිගැනීම,සටන්",
    views: 39880,
    links: [
      { label: "1080p", url: "https://t.me/ben10sl/10", size: 756 },
      { label: "720p", url: "https://t.me/ben10sl/11", size: 430 },
    ],
  },

  /* -------------------------- Alien Force -------------------------- */
  {
    category: "alien-force",
    code: "B10-AF-001",
    title: "බෙන් 10 නැවත පැමිණේ",
    title_en: "Ben 10 Returns",
    season: 1,
    episode_number: 1,
    episode_type: "episode",
    synopsis:
      "වසර පහක් ගත වී ඇත. ඔම්නිට්‍රික්ස් නැවත ලබාගත් බෙන්, ග්වෙන් හා කෙවින් සමඟ ලෝකයට එල්ල වන අලුත් තර්ජනයක් වළක්වන්නට එක්වේ.",
    thumbnail: ART.alienforce,
    quality: "1080p",
    duration_minutes: 44,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-04-07",
    aired_date: "2008-04-18",
    tags: "නව මාලාව,එලියන් ෆෝස්,නයිට්‍රික්ස්",
    featured: true,
    views: 52310,
    links: [
      { label: "1080p", url: "https://t.me/ben10sl/20", size: 1240 },
      { label: "720p", url: "https://t.me/ben10sl/21", size: 704 },
      { label: "480p", url: "https://t.me/ben10sl/22", size: 352 },
    ],
  },
  {
    category: "alien-force",
    code: "B10-AF-002",
    title: "කෙවින්ගේ මහා ජයග්‍රහණය",
    title_en: "Kevin's Big Score",
    season: 1,
    episode_number: 2,
    episode_type: "episode",
    synopsis:
      "කෙවින් අතීතයේ දී තැබූ වටිනා බැඳුමක් ඔහුගේ පැරණි කොටස්කරුවන් නැවත ඉල්ලා සිටිති. එය බෙන්ගේ කණ්ඩායමට හොඳ පාඩමක් වේ.",
    thumbnail: ART.alienforce,
    quality: "1080p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-04-14",
    aired_date: "2008-04-19",
    tags: "කෙවින්,අතීතය,සටන්",
    views: 28990,
    links: [
      { label: "1080p", url: "https://t.me/ben10sl/23", size: 812 },
      { label: "720p", url: "https://t.me/ben10sl/24", size: 465 },
    ],
  },
  {
    category: "alien-force",
    code: "B10-AF-003",
    title: "රන් වන සියල්ල",
    title_en: "All That Glitters",
    season: 1,
    episode_number: 3,
    episode_type: "episode",
    synopsis:
      "පාසලේ සිසුන් අමුතු ලෙස හැසිරෙන්නට පටන් ගනී. ඒ පිටුපස සිටින්නේ අවිනිශ්චිත බලයක් සොයා යන කෙනෙකි.",
    thumbnail: ART.alienforce,
    quality: "720p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-04-21",
    aired_date: "2008-04-26",
    tags: "පාසල,අද්භූත,විමර්ශන",
    views: 21450,
    links: [{ label: "720p", url: "https://t.me/ben10sl/25", size: 448 }],
  },
  {
    category: "alien-force",
    code: "B10-AF-004",
    title: "විල්ගැක්ස්ගේ පළිගැනීම",
    title_en: "Vengeance of Vilgax",
    season: 2,
    episode_number: 13,
    episode_type: "episode",
    synopsis:
      "විල්ගැක්ස් නැවත පැමිණ බෙන්ට අභියෝගයක් එල්ල කරයි. ලෝක ආරක්ෂාව ඔට්ටු වන මෙම සටන බෙන්ගේ ජීවිතයේ ලොකුම අභියෝගය බවට පත්වේ.",
    thumbnail: ART.alienforce,
    quality: "1080p",
    duration_minutes: 44,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-05-05",
    aired_date: "2009-03-27",
    tags: "විල්ගැක්ස්,සටන්,තරඟය",
    featured: true,
    views: 44780,
    links: [
      { label: "1080p", url: "https://t.me/ben10sl/26", size: 1180 },
      { label: "720p", url: "https://t.me/ben10sl/27", size: 690 },
    ],
  },

  /* ------------------------- Ultimate Alien ------------------------ */
  {
    category: "ultimate-alien",
    code: "B10-UA-001",
    title: "කීර්තිය",
    title_en: "Fame",
    season: 1,
    episode_number: 1,
    episode_type: "episode",
    synopsis:
      "බෙන්ගේ අනන්‍යතාව මුළු ලෝකයම දැනගනී. නව අල්ටිමේට්‍රික්ස් උපකරණය සමඟ ඔහුට නව අභියෝගවලට මුහුණ දීමට සිදුවේ.",
    thumbnail: ART.ultimate,
    quality: "1080p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-06-02",
    aired_date: "2010-04-23",
    tags: "අල්ටිමේට්‍රික්ස්,නව මාලාව,කීර්තිය",
    featured: true,
    views: 36720,
    links: [
      { label: "1080p", url: "https://t.me/ben10sl/30", size: 848 },
      { label: "720p", url: "https://t.me/ben10sl/31", size: 486 },
    ],
  },
  {
    category: "ultimate-alien",
    code: "B10-UA-002",
    title: "ඔවුන් ජීවත් වන තැනටම පහර දෙන්න",
    title_en: "Hit 'Em Where They Live",
    season: 1,
    episode_number: 2,
    episode_type: "episode",
    synopsis:
      "බෙන්ගේ පවුලේ අය අවදානමට ලක්වේ. ඔහුගේ සතුරන් නගරයට කෙලින්ම පහර දෙන්නට පටන් ගනී.",
    thumbnail: ART.ultimate,
    quality: "720p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-06-09",
    aired_date: "2010-04-30",
    tags: "පවුල,සටන්,නගරය",
    views: 25120,
    links: [{ label: "720p", url: "https://t.me/ben10sl/32", size: 452 }],
  },
  {
    category: "ultimate-alien",
    code: "B10-UA-003",
    title: "සම්පූර්ණ බලය",
    title_en: "Absolute Power",
    season: 1,
    episode_number: 20,
    episode_type: "special",
    synopsis:
      "බලය සොයා යන දෙදෙනෙකු එකට එක්වූ විට මුළු පෘථිවියම අවදානමට ලක්වේ. එය නැවැත්වීමට බෙන් හා ග්වෙන් සියල්ල කැපකරති.",
    thumbnail: ART.ultimate,
    quality: "1080p",
    duration_minutes: 46,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-06-30",
    aired_date: "2010-12-10",
    tags: "විශේෂ,බලය,සටන",
    views: 29980,
    links: [
      { label: "1080p", url: "https://t.me/ben10sl/33", size: 1310 },
      { label: "720p", url: "https://t.me/ben10sl/34", size: 742 },
    ],
  },

  /* ---------------------------- Omniverse -------------------------- */
  {
    category: "omniverse",
    code: "B10-OV-001",
    title: "වෙනස් වූ දේවල්",
    title_en: "The More Things Change",
    season: 1,
    episode_number: 1,
    episode_type: "episode",
    synopsis:
      "බෙන් නැවත බෙල්වුඩ් නගරයට පැමිණෙන අතර, ඔම්නිට්‍රික්ස්හි නව ලෝකයක් හෙළිදරව් වේ.",
    thumbnail: ART.omniverse,
    quality: "1080p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-08-04",
    aired_date: "2012-08-01",
    tags: "නව පෙනුම,ඕම්නිවර්ස්,බෙල්වුඩ්",
    featured: true,
    views: 33890,
    links: [
      { label: "1080p", url: "https://t.me/ben10sl/40", size: 802 },
      { label: "720p", url: "https://t.me/ben10sl/41", size: 462 },
    ],
  },
  {
    category: "omniverse",
    code: "B10-OV-002",
    title: "කොහෙන්දෝ ආ විදුලිය",
    title_en: "A Jolt from Nowhere",
    season: 1,
    episode_number: 2,
    episode_type: "episode",
    synopsis:
      "අමුතු අධි-වෝල්ටීයතා බලයක් නගරයේ ඇතිවන අතර එය පිටුපස සිටින එලියන් තරුණයා බෙන්ට හමුවේ.",
    thumbnail: ART.omniverse,
    quality: "720p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-08-11",
    aired_date: "2012-08-02",
    tags: "ෆීඩ්බැක්,විදුලිය,එලියන්",
    views: 22140,
    links: [{ label: "720p", url: "https://t.me/ben10sl/42", size: 438 }],
  },
  {
    category: "omniverse",
    code: "B10-OV-003",
    title: "ගබඩාව 23",
    title_en: "Store 23",
    season: 3,
    episode_number: 6,
    episode_type: "episode",
    synopsis:
      "අමුතු සාප්පුවක් තුළ සැඟවුණු වෙනත් මානයකට බෙන් හා රූක් ඇතුළු වේ. එහිදී ඔවුන්ට වෙනස් ලෝකයක් හමුවේ.",
    thumbnail: ART.omniverse,
    quality: "1080p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-08-25",
    aired_date: "2013-03-16",
    tags: "මාන,රූක්,වික්‍රම",
    views: 24560,
    links: [
      { label: "1080p", url: "https://t.me/ben10sl/43", size: 790 },
      { label: "720p", url: "https://t.me/ben10sl/44", size: 448 },
    ],
  },

  /* ------------------------------ Reboot --------------------------- */
  {
    category: "reboot",
    code: "B10-RB-001",
    title: "නැවත ආරම්භය — පළමු කථාංගය",
    title_en: "Reboot — Episode 1",
    season: 1,
    episode_number: 1,
    episode_type: "episode",
    synopsis:
      "නවීන නිර්මාණයේ බෙන් ටෙනිසන් නව එලියන්ස් සමඟ නව වික්‍රමාන්විත ලෝකයකට අවතීර්ණ වේ.",
    thumbnail: ART.reboot,
    quality: "1080p",
    duration_minutes: 12,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-09-15",
    aired_date: "2016-10-01",
    tags: "රීබූට්,නව මාලාව,පළමු කථාංගය",
    views: 18760,
    links: [
      { label: "1080p", url: "https://t.me/ben10sl/50", size: 386 },
      { label: "720p", url: "https://t.me/ben10sl/51", size: 228 },
    ],
  },

  /* ------------------------- Movies & Specials --------------------- */
  {
    category: "movies-specials",
    code: "B10-MV-001",
    title: "ඔම්නිට්‍රික්ස්හි රහස",
    title_en: "Secret of the Omnitrix",
    season: 0,
    episode_number: null,
    episode_type: "movie",
    synopsis:
      "ඔම්නිට්‍රික්ස් විනාශ වීමට ලක්වූ විට බෙන්ට තමන්ගේ එලියන් බලය නැතිවී යාමේ අවදානමට මුහුණ දෙන්නට සිදුවේ. ඔහු උපකරණයේ නිර්මාපකයා සොයා ගැනීමට යයි.",
    thumbnail: ART.movies,
    quality: "1080p",
    duration_minutes: 75,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-10-05",
    aired_date: "2007-08-10",
    tags: "චිත්‍රපටය,ඔම්නිට්‍රික්ස්,රහස",
    featured: true,
    views: 61240,
    links: [
      { label: "1080p", url: "https://t.me/ben10sl/60", size: 2140 },
      { label: "720p", url: "https://t.me/ben10sl/61", size: 1180 },
      { label: "480p", url: "https://t.me/ben10sl/62", size: 620 },
    ],
  },
  {
    category: "movies-specials",
    code: "B10-MV-002",
    title: "කාලය සමඟ තරඟය",
    title_en: "Race Against Time",
    season: 0,
    episode_number: null,
    episode_type: "movie",
    synopsis:
      "කාලය විකෘති කරන නපුරු බලවේගයක් නැවැත්වීමට බෙන්ට කාලය හා ඉරියව්ව පරයා යාමට සිදුවේ.",
    thumbnail: ART.movies,
    quality: "1080p",
    duration_minutes: 90,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-10-19",
    aired_date: "2007-11-21",
    tags: "චිත්‍රපටය,කාලය,සටන",
    views: 38990,
    links: [
      { label: "1080p", url: "https://t.me/ben10sl/63", size: 2420 },
      { label: "720p", url: "https://t.me/ben10sl/64", size: 1320 },
    ],
  },
  {
    category: "movies-specials",
    code: "B10-MV-003",
    title: "එලියන් ස්වාම්",
    title_en: "Alien Swarm",
    season: 0,
    episode_number: null,
    episode_type: "movie",
    synopsis:
      "අහසින් වැටෙන අමුතු එලියන් බීජ නගරය තුළ ව්‍යාප්ත වන විට බෙන් හා ඔහුගේ කණ්ඩායම ඒවා නැවැත්වීමට එක්වේ.",
    thumbnail: ART.movies,
    quality: "1080p",
    duration_minutes: 70,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-11-02",
    aired_date: "2009-11-25",
    tags: "චිත්‍රපටය,එලියන්,ස්වාම්",
    views: 31550,
    links: [
      { label: "1080p", url: "https://t.me/ben10sl/65", size: 2040 },
      { label: "720p", url: "https://t.me/ben10sl/66", size: 1110 },
    ],
  },
  {
    category: "movies-specials",
    code: "B10-MV-004",
    title: "සියලුම එලියන්ස් විනාශ කරන්න",
    title_en: "Destroy All Aliens",
    season: 0,
    episode_number: null,
    episode_type: "movie",
    synopsis:
      "බෙන්ගේ ප්‍රති-එලියන් අවි නැවත පණ ගැන්වෙන විට, ලෝකයේ සියලු එලියන්ස්ව බේරා ගැනීමට බෙන්ට තමන්ටම එරෙහිව සටන් කිරීමට සිදුවේ.",
    thumbnail: ART.movies,
    quality: "1080p",
    duration_minutes: 68,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-11-16",
    aired_date: "2012-03-23",
    tags: "චිත්‍රපටය,එලියන්,සටන",
    views: 27330,
    links: [{ label: "1080p", url: "https://t.me/ben10sl/67", size: 1980 }],
  },
  {
    category: "movies-specials",
    code: "B10-MV-005",
    title: "බෙන් 10 එදිරිව විශ්වය",
    title_en: "Ben 10 vs. The Universe",
    season: 0,
    episode_number: null,
    episode_type: "movie",
    synopsis:
      "විශ්වයේ ඉරණම තීරණය වන මහා සටනක්. බෙන් සිය සියලුම එලියන් බලය භාවිතා කරමින් ලෝකය බේරා ගැනීමට උත්සාහ කරයි.",
    thumbnail: ART.movies,
    quality: "1080p",
    duration_minutes: 72,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-12-07",
    aired_date: "2020-10-11",
    tags: "චිත්‍රපටය,විශ්වය,සමාප්තිය",
    featured: true,
    views: 42110,
    links: [
      { label: "1080p", url: "https://t.me/ben10sl/68", size: 2260 },
      { label: "720p", url: "https://t.me/ben10sl/69", size: 1240 },
    ],
  },
];

const SETTINGS_SEED: Record<string, string> = {
  site_name: "Ben 10 SL",
  site_tagline: "සිංහල හඬකැවීම",
  site_description:
    "Ben 10 සම්පූර්ණ කථාංග මාලාව සහ චිත්‍රපට — සම්පූර්ණයෙන්ම සිංහල හඬකැවීමෙන්. නොමිලේ නරඹන්න, බාගන්න.",
  // the fan-page logo (hosted url or /uploads/... after using the admin uploader)
  logo_url: "https://i.ibb.co/99p93Zfc/file-66.jpg",
  logo_text: "Ben 10 SL",
  announcement: "🎬 සතියේ නවතම සිංහල කථාංගය — බෙන් 10 සියලුම චිත්‍රපට දැන් නැරඹිය හැකියි!",
  hero_kicker: "සිංහල හඬකැවීම",
  hero_title: "ඔම්නිට්‍රික්ස් ඔබේ අතේ",
  hero_subtitle:
    "Ben 10 ක්ලැසික් සිට ඕම්නිවර්ස් දක්වා සියලුම කථාංග සහ චිත්‍රපට — සිංහලෙන් සම්පූර්ණයෙන්ම හඬකැවූ.",
  hero_image: "/art/hero-alien-tech.jpg",
  // paste a Sinhala dubbed YouTube link from the admin panel to fill the home-page player
  featured_youtube: "",
  telegram_url: "https://t.me/ben10sl",
  telegram_requests: "https://t.me/ben10sl",
  contact_email: "hello@ben10sl.lk",
  footer_note: "මෙය රසිකයන් විසින් නිර්මිත අනධිකාරී රසික පිටුවකි.",
  disclaimer:
    "අපගේ වෙබ් අඩවියේ කිසිදු වීඩියෝ ගොනුවක් ගබඩා නොකෙරේ. සියලුම වීඩියෝ පිටත සේවාදායක හෝ ටෙලිග්‍රෑම් නාලිකා හරහා සම්බන්ධ වේ. සියලුම අයිතිවාසිකම් Cartoon Network සහ අදාළ හිමිකරුවන් සතුය.",
  telegram_members: "12,400",
  releases_label: "නිකුතු",
  site_online_since: "2023-01-15",
};

function seed(db: DB) {
  const insertSetting = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING",
  );

  const categoryCount = db.prepare("SELECT COUNT(*) AS c FROM categories").get() as { c: number };
  if (categoryCount.c === 0) {
    const insertCategory = db.prepare(
      `INSERT INTO categories (name, name_si, slug, description, accent, sort_order)
       VALUES (@name, @name_si, @slug, @description, @accent, @sort_order)`,
    );
    const insertRelease = db.prepare(
      `INSERT INTO releases (
         category_id, code, title, title_en, slug, season, episode_number, episode_type,
         synopsis, thumbnail, quality, duration_minutes, dubbed_studio, dubbed_date,
         aired_date, telegram_url, source, language, tags, views, featured, status
       ) VALUES (
         @category_id, @code, @title, @title_en, @slug, @season, @episode_number, @episode_type,
         @synopsis, @thumbnail, @quality, @duration_minutes, @dubbed_studio, @dubbed_date,
         @aired_date, @telegram_url, @source, 'sinhala', @tags, @views, @featured, 'published'
       )`,
    );
    const insertQuality = db.prepare(
      "INSERT INTO qualities (release_id, label, url, file_size_mb, position) VALUES (?, ?, ?, ?, ?)",
    );

    const seedAll = db.transaction(() => {
      const categoryIds = new Map<string, number>();
      for (const category of CATEGORY_SEED) {
        const info = insertCategory.run(category);
        categoryIds.set(category.slug, Number(info.lastInsertRowid));
      }

      for (const release of seedReleases) {
        const info = insertRelease.run({
          category_id: categoryIds.get(release.category) ?? 1,
          code: release.code,
          title: release.title,
          title_en: release.title_en,
          slug: release.code.toLowerCase(),
          season: release.season,
          episode_number: release.episode_number,
          episode_type: release.episode_type,
          synopsis: release.synopsis,
          thumbnail: release.thumbnail,
          quality: release.quality,
          duration_minutes: release.duration_minutes,
          dubbed_studio: release.dubbed_studio,
          dubbed_date: release.dubbed_date,
          aired_date: release.aired_date,
          telegram_url: "https://t.me/ben10sl",
          source: "Cartoon Network (සිංහල හඬකැවීම)",
          tags: release.tags,
          views: release.views,
          featured: release.featured ? 1 : 0,
        });
        const releaseId = Number(info.lastInsertRowid);
        release.links.forEach((link, index) => {
          insertQuality.run(releaseId, link.label, link.url, link.size, index);
        });
      }
    });

    seedAll();
  }

  const settingsSeed = db.transaction(() => {
    for (const [key, value] of Object.entries(SETTINGS_SEED)) {
      insertSetting.run(key, value);
    }
  });
  settingsSeed();
}
