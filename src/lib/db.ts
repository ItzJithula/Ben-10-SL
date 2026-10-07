import fs from "node:fs";
import path from "node:path";

import { dataDir } from "./server-paths";

/**
 * Database layer — PostgreSQL on Neon, queried over HTTPS.
 *
 * The connection string is read from the environment (Vercel sets `DATABASE_URL`
 * when you attach a Neon database to the project):
 *
 *   DATABASE_URL=postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/db?sslmode=require
 *
 * Nothing else has to be done by hand: the first query of a boot creates the
 * tables (`CREATE TABLE IF NOT EXISTS`) and seeds the demo archive when the
 * database is still empty. Everything is idempotent, so restarts and concurrent
 * cold starts are safe.
 *
 * Local development without a Neon database falls back to an embedded
 * PostgreSQL (PGlite) that persists to ./data/pglite, so `npm run dev` keeps
 * working with zero configuration.
 */

/* ------------------------------------------------------------------ */
/* Driver                                                              */
/* ------------------------------------------------------------------ */

export interface Statement {
  text: string;
  params?: unknown[];
}

interface Driver {
  /** Name of the active backend, handy in logs. */
  label: "neon" | "pglite";
  query<T>(text: string, params: unknown[]): Promise<T[]>;
  /** Runs every statement in one Postgres transaction (single round trip). */
  transaction(statements: Statement[]): Promise<void>;
}

const CONNECTION_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
] as const;

export function connectionString(): string | null {
  for (const key of CONNECTION_KEYS) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return null;
}

export function usingNeon(): boolean {
  return connectionString() !== null;
}

/** `to_char(...)` expression used for created_at / updated_at (kept as text). */
export const NOW_SQL = `to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')`;

async function createNeonDriver(url: string): Promise<Driver> {
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(url);

  return {
    label: "neon",
    async query<T>(text: string, params: unknown[]): Promise<T[]> {
      return (await sql.query(text, params)) as T[];
    },
    async transaction(statements: Statement[]): Promise<void> {
      if (statements.length === 0) return;
      await sql.transaction((txn) =>
        statements.map((statement) => txn.query(statement.text, statement.params ?? [])),
      );
    },
  };
}

/** Embedded PostgreSQL for local development (no DATABASE_URL required). */
async function createLocalDriver(): Promise<Driver> {
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = path.join(dataDir(), "pglite");
  fs.mkdirSync(dir, { recursive: true });
  const pg = new PGlite(dir);
  await pg.waitReady;

  return {
    label: "pglite",
    async query<T>(text: string, params: unknown[]): Promise<T[]> {
      const result = await pg.query<T>(text, params);
      return result.rows;
    },
    async transaction(statements: Statement[]): Promise<void> {
      if (statements.length === 0) return;
      await pg.transaction(async (tx) => {
        for (const statement of statements) {
          await tx.query(statement.text, statement.params ?? []);
        }
      });
    },
  };
}

const globalForDb = globalThis as unknown as {
  __ben10slDriver?: Promise<Driver>;
  __ben10slReady?: WeakMap<Driver, Promise<void>>;
};

function driver(): Promise<Driver> {
  if (!globalForDb.__ben10slDriver) {
    const url = connectionString();
    let pending: Promise<Driver>;

    if (url) {
      pending = createNeonDriver(url);
    } else if (process.env.NODE_ENV === "production") {
      pending = Promise.reject(
        new Error(
          "[Ben 10 SL] DATABASE_URL is not set. Add your Neon connection string " +
            "(Project → Connection string) to the environment variables — on Vercel that is " +
            "Settings → Environment Variables → DATABASE_URL — and redeploy.",
        ),
      );
    } else {
      console.warn(
        "[Ben 10 SL] DATABASE_URL is not set — using the embedded local PostgreSQL (./data/pglite).",
      );
      pending = createLocalDriver();
    }

    // A failed connection must not be cached forever: drop it so the next
    // request can retry (e.g. after fixing the environment variable).
    pending.catch(() => {
      if (globalForDb.__ben10slDriver === pending) globalForDb.__ben10slDriver = undefined;
    });

    globalForDb.__ben10slDriver = pending;
  }

  return globalForDb.__ben10slDriver;
}

/** Resolves the driver and makes sure the schema exists (once per process). */
async function ready(): Promise<Driver> {
  const active = await driver();

  globalForDb.__ben10slReady ??= new WeakMap();
  let initialised = globalForDb.__ben10slReady.get(active);
  if (!initialised) {
    initialised = ensureDatabase(active);
    globalForDb.__ben10slReady.set(active, initialised);
    initialised.catch(() => {
      globalForDb.__ben10slReady?.delete(active);
    });
  }
  await initialised;

  return active;
}

/* ------------------------------------------------------------------ */
/* Public query helpers                                                */
/* ------------------------------------------------------------------ */

/** Runs a query and returns its rows. Use `$1`, `$2`, … placeholders. */
export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const active = await ready();
  return active.query<T>(text, params);
}

/** Runs a query that is expected to return at most one row. */
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** Runs a write statement whose result is not needed. */
export async function execute(text: string, params: unknown[] = []): Promise<void> {
  await query(text, params);
}

/** Runs several statements atomically, in a single transaction. */
export async function transaction(statements: Statement[]): Promise<void> {
  const active = await ready();
  await active.transaction(statements);
}

/** True when the error is a Postgres unique-constraint violation (23505). */
export function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { code?: string; message?: string };
  if (candidate.code === "23505") return true;
  return /duplicate key value|unique constraint/i.test(candidate.message ?? "");
}

/* ------------------------------------------------------------------ */
/* Schema                                                              */
/* ------------------------------------------------------------------ */

/**
 * Notes on a few deliberate choices:
 *  - `created_at` / `updated_at` are text in `YYYY-MM-DD HH24:MI:SS` (UTC).
 *    The UI formats them as plain strings and sorts them lexicographically,
 *    which is chronological in this format, so no timezone surprises.
 *  - `featured` is a 0/1 integer flag rather than a boolean so the archive
 *    keeps its simple `featured DESC` ordering and form handling.
 */
const SCHEMA: Statement[] = [
  {
    text: `CREATE TABLE IF NOT EXISTS categories (
             id           INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
             name         TEXT NOT NULL,
             name_alt     TEXT NOT NULL DEFAULT '',
             slug         TEXT NOT NULL UNIQUE,
             description  TEXT NOT NULL DEFAULT '',
             accent       TEXT NOT NULL DEFAULT '#39FF14',
             sort_order   INTEGER NOT NULL DEFAULT 0,
             created_at   TEXT NOT NULL DEFAULT ${NOW_SQL}
           )`,
  },
  {
    text: `CREATE TABLE IF NOT EXISTS releases (
             id               INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
             category_id      INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
             code             TEXT NOT NULL DEFAULT '',
             title            TEXT NOT NULL,
             subtitle         TEXT NOT NULL DEFAULT '',
             slug             TEXT NOT NULL UNIQUE,
             season           INTEGER NOT NULL DEFAULT 1,
             episode_number   INTEGER,
             episode_type     TEXT NOT NULL DEFAULT 'episode'
                              CHECK (episode_type IN ('episode','movie','special','short')),
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
             status           TEXT NOT NULL DEFAULT 'published'
                              CHECK (status IN ('published','draft')),
             created_at       TEXT NOT NULL DEFAULT ${NOW_SQL},
             updated_at       TEXT NOT NULL DEFAULT ${NOW_SQL}
           )`,
  },
  {
    text: `CREATE TABLE IF NOT EXISTS qualities (
             id            INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
             release_id    INTEGER NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
             label         TEXT NOT NULL,
             url           TEXT NOT NULL,
             file_size_mb  INTEGER,
             position      INTEGER NOT NULL DEFAULT 0
           )`,
  },
  {
    text: `CREATE TABLE IF NOT EXISTS settings (
             key   TEXT PRIMARY KEY,
             value TEXT NOT NULL
           )`,
  },
  { text: `CREATE INDEX IF NOT EXISTS idx_releases_category ON releases(category_id)` },
  { text: `CREATE INDEX IF NOT EXISTS idx_releases_status ON releases(status)` },
  { text: `CREATE INDEX IF NOT EXISTS idx_releases_type ON releases(episode_type)` },
  {
    text: `CREATE UNIQUE INDEX IF NOT EXISTS idx_releases_code
             ON releases(code) WHERE code <> ''`,
  },
  { text: `CREATE INDEX IF NOT EXISTS idx_qualities_release ON qualities(release_id)` },
];

/* ------------------------------------------------------------------ */
/* Seed data — Ben 10 releases with Sinhala dubbed audio               */
/* ------------------------------------------------------------------ */

const CATEGORY_SEED = [
  {
    name: "Ben 10 Classic",
    name_alt: "2005 Series",
    slug: "classic",
    description: "The original series — where Ben Tennyson first found the Omnitrix.",
    accent: "#39FF14",
    sort_order: 1,
  },
  {
    name: "Alien Force",
    name_alt: "2008 Series",
    slug: "alien-force",
    description: "Five years later — Ben returns with a brand-new team of aliens.",
    accent: "#00E5FF",
    sort_order: 2,
  },
  {
    name: "Ultimate Alien",
    name_alt: "2010 Series",
    slug: "ultimate-alien",
    description: "Ultimate transformations and tougher, more serious fights.",
    accent: "#FF7A00",
    sort_order: 3,
  },
  {
    name: "Omniverse",
    name_alt: "2012 Series",
    slug: "omniverse",
    description: "A multiverse road trip with a fresh art style and new aliens.",
    accent: "#B026FF",
    sort_order: 4,
  },
  {
    name: "Reboot",
    name_alt: "2016 Series",
    slug: "reboot",
    description: "The 2016 reboot — lighter, faster and funnier episodes.",
    accent: "#FFC400",
    sort_order: 5,
  },
  {
    name: "Movies & Specials",
    name_alt: "Feature Length",
    slug: "movies-specials",
    description: "Full-length films and specials from outside the TV seasons.",
    accent: "#FF2E88",
    sort_order: 6,
  },
];

interface SeedRelease {
  category: string;
  code: string;
  title: string;
  subtitle: string;
  slug: string;
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

const STUDIO = "SL Dub Studio";

const seedReleases: SeedRelease[] = [
  /* ---------------------------- Classic ---------------------------- */
  {
    category: "classic",
    code: "B10-CL-001",
    title: "And Then There Were 10",
    subtitle: "Ben 10 Classic · Season 1",
    slug: "and-then-there-were-10",
    season: 1,
    episode_number: 1,
    episode_type: "episode",
    synopsis:
      "On the last day of summer camp, a strange device falls out of the sky in front of Ben Tennyson. With ten alien forms suddenly at his fingertips, his life changes forever.",
    thumbnail: ART.classic,
    quality: "1080p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-02-11",
    aired_date: "2005-12-27",
    tags: "origin,omnitrix,ben,gwen,kevin",
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
    title: "Washington B.C.",
    subtitle: "Ben 10 Classic · Season 1",
    slug: "washington-bc",
    season: 1,
    episode_number: 2,
    episode_type: "episode",
    synopsis:
      "Dr. Animo uses a stolen device to bring prehistoric creatures back to life and sets them loose on the city. Ben has to round up a stampede of monsters that should have stayed extinct.",
    thumbnail: ART.classic,
    quality: "1080p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-02-18",
    aired_date: "2006-01-14",
    tags: "animo,creatures,dinosaurs",
    views: 31240,
    links: [
      { label: "1080p", url: "https://t.me/ben10sl/4", size: 738 },
      { label: "720p", url: "https://t.me/ben10sl/5", size: 421 },
    ],
  },
  {
    category: "classic",
    code: "B10-CL-003",
    title: "The Krakken",
    subtitle: "Ben 10 Classic · Season 1",
    slug: "the-krakken",
    season: 1,
    episode_number: 3,
    episode_type: "episode",
    synopsis:
      "A quiet lake holiday turns into a mystery when something enormous stirs in the deep water — and a poacher wants to catch it before anyone else does.",
    thumbnail: ART.classic,
    quality: "720p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-02-25",
    aired_date: "2006-01-21",
    tags: "lake,creature,mystery",
    views: 27655,
    links: [
      { label: "720p", url: "https://t.me/ben10sl/6", size: 402 },
      { label: "480p", url: "https://t.me/ben10sl/7", size: 205 },
    ],
  },
  {
    category: "classic",
    code: "B10-CL-004",
    title: "Permanent Retirement",
    subtitle: "Ben 10 Classic · Season 1",
    slug: "permanent-retirement",
    season: 1,
    episode_number: 4,
    episode_type: "episode",
    synopsis:
      "A friendly retirement home is hiding a criminal operation — and Ben's own grandparents are right in the middle of it.",
    thumbnail: ART.classic,
    quality: "720p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-03-03",
    aired_date: "2006-01-28",
    tags: "retirement,heist,family",
    views: 25110,
    links: [{ label: "720p", url: "https://t.me/ben10sl/8", size: 398 }],
  },
  {
    category: "classic",
    code: "B10-CL-005",
    title: "Hunted",
    subtitle: "Ben 10 Classic · Season 1",
    slug: "hunted",
    season: 1,
    episode_number: 5,
    episode_type: "episode",
    synopsis:
      "Three bounty hunters are hired to take the Omnitrix from Ben, and none of them is willing to take no for an answer. Ben has to decide how far he will go to keep his secret.",
    thumbnail: ART.classic,
    quality: "720p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-03-10",
    aired_date: "2006-02-04",
    tags: "bounty-hunters,kevin,fight",
    views: 24398,
    links: [{ label: "720p", url: "https://t.me/ben10sl/9", size: 405 }],
  },
  {
    category: "classic",
    code: "B10-CL-006",
    title: "Kevin 11",
    subtitle: "Ben 10 Classic · Season 1",
    slug: "kevin-11",
    season: 1,
    episode_number: 6,
    episode_type: "episode",
    synopsis:
      "Kevin absorbs the power of the Omnitrix and comes back stronger than ever. Ben has to out-think a villain who fights with copies of his own aliens.",
    thumbnail: ART.classic,
    quality: "1080p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-03-17",
    aired_date: "2006-08-26",
    tags: "kevin,revenge,fight",
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
    title: "Ben 10 Returns",
    subtitle: "Alien Force · Season 1",
    slug: "ben-10-returns",
    season: 1,
    episode_number: 1,
    episode_type: "episode",
    synopsis:
      "Five years have passed. With the Omnitrix back on his wrist, Ben teams up with Gwen and Kevin to stop a new threat that is targeting the whole planet.",
    thumbnail: ART.alienforce,
    quality: "1080p",
    duration_minutes: 44,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-04-07",
    aired_date: "2008-04-18",
    tags: "new-series,alien-force,highbreed",
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
    title: "Kevin's Big Score",
    subtitle: "Alien Force · Season 1",
    slug: "kevins-big-score",
    season: 1,
    episode_number: 2,
    episode_type: "episode",
    synopsis:
      "Kevin's old partners in crime come looking for what they are owed, and his past catches up with the whole team.",
    thumbnail: ART.alienforce,
    quality: "1080p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-04-14",
    aired_date: "2008-04-19",
    tags: "kevin,backstory,fight",
    views: 28990,
    links: [
      { label: "1080p", url: "https://t.me/ben10sl/23", size: 812 },
      { label: "720p", url: "https://t.me/ben10sl/24", size: 465 },
    ],
  },
  {
    category: "alien-force",
    code: "B10-AF-003",
    title: "All That Glitters",
    subtitle: "Alien Force · Season 1",
    slug: "all-that-glitters",
    season: 1,
    episode_number: 3,
    episode_type: "episode",
    synopsis:
      "Students at school start behaving strangely, and the trail leads to someone chasing a kind of power they cannot control.",
    thumbnail: ART.alienforce,
    quality: "720p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-04-21",
    aired_date: "2008-04-26",
    tags: "school,mystery,investigation",
    views: 21450,
    links: [{ label: "720p", url: "https://t.me/ben10sl/25", size: 448 }],
  },
  {
    category: "alien-force",
    code: "B10-AF-004",
    title: "Vengeance of Vilgax",
    subtitle: "Alien Force · Season 2",
    slug: "vengeance-of-vilgax",
    season: 2,
    episode_number: 13,
    episode_type: "episode",
    synopsis:
      "Vilgax returns and challenges Ben directly. With the safety of the planet on the line, the fight that follows becomes the biggest test of Ben's life.",
    thumbnail: ART.alienforce,
    quality: "1080p",
    duration_minutes: 44,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-05-05",
    aired_date: "2009-03-27",
    tags: "vilgax,fight,challenge",
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
    title: "Fame",
    subtitle: "Ultimate Alien · Season 1",
    slug: "fame",
    season: 1,
    episode_number: 1,
    episode_type: "episode",
    synopsis:
      "Ben's identity becomes public knowledge. With the new Ultimatrix on his wrist, he faces a whole new set of enemies — and the cameras never stop rolling.",
    thumbnail: ART.ultimate,
    quality: "1080p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-06-02",
    aired_date: "2010-04-23",
    tags: "ultimatrix,new-series,fame",
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
    title: "Hit 'Em Where They Live",
    subtitle: "Ultimate Alien · Season 1",
    slug: "hit-em-where-they-live",
    season: 1,
    episode_number: 2,
    episode_type: "episode",
    synopsis:
      "Ben's family is put in danger when his enemies stop hiding and attack the city head-on.",
    thumbnail: ART.ultimate,
    quality: "720p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-06-09",
    aired_date: "2010-04-30",
    tags: "family,fight,home",
    views: 25120,
    links: [{ label: "720p", url: "https://t.me/ben10sl/32", size: 452 }],
  },
  {
    category: "ultimate-alien",
    code: "B10-UA-003",
    title: "Absolute Power",
    subtitle: "Ultimate Alien · Special",
    slug: "absolute-power",
    season: 1,
    episode_number: 20,
    episode_type: "special",
    synopsis:
      "Two power-hungry villains join forces and put the entire planet at risk. Ben and Gwen have to give everything they have to stop them.",
    thumbnail: ART.ultimate,
    quality: "1080p",
    duration_minutes: 46,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-06-30",
    aired_date: "2010-12-10",
    tags: "special,power,team-up",
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
    title: "The More Things Change",
    subtitle: "Omniverse · Season 1",
    slug: "the-more-things-change",
    season: 1,
    episode_number: 1,
    episode_type: "episode",
    synopsis:
      "Ben heads back to Bellwood with the new Omnitrix, only to find that a whole new universe of trouble has moved in while he was away.",
    thumbnail: ART.omniverse,
    quality: "1080p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-08-04",
    aired_date: "2012-08-01",
    tags: "new-look,omniverse,bellwood",
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
    title: "A Jolt from Nowhere",
    subtitle: "Omniverse · Season 1",
    slug: "a-jolt-from-nowhere",
    season: 1,
    episode_number: 2,
    episode_type: "episode",
    synopsis:
      "Strange high-voltage surges hit the city, and the young alien responsible wants to meet Ben face to face.",
    thumbnail: ART.omniverse,
    quality: "720p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-08-11",
    aired_date: "2012-08-02",
    tags: "feedback,electricity,alien",
    views: 22140,
    links: [{ label: "720p", url: "https://t.me/ben10sl/42", size: 438 }],
  },
  {
    category: "omniverse",
    code: "B10-OV-003",
    title: "Store 23",
    subtitle: "Omniverse · Season 3",
    slug: "store-23",
    season: 3,
    episode_number: 6,
    episode_type: "episode",
    synopsis:
      "A routine shopping trip turns into a trip between dimensions when Ben and Rook step through the wrong door.",
    thumbnail: ART.omniverse,
    quality: "1080p",
    duration_minutes: 22,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-08-25",
    aired_date: "2013-03-16",
    tags: "dimensions,rook,adventure",
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
    title: "Waterfilter",
    subtitle: "Reboot · Season 1",
    slug: "waterfilter",
    season: 1,
    episode_number: 1,
    episode_type: "episode",
    synopsis:
      "The 2016 reboot kicks off as Ben discovers his alien forms all over again, with a brand-new cast of characters along for the ride.",
    thumbnail: ART.reboot,
    quality: "1080p",
    duration_minutes: 12,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-09-15",
    aired_date: "2016-10-01",
    tags: "reboot,new-series,premiere",
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
    title: "Secret of the Omnitrix",
    subtitle: "Feature Film",
    slug: "secret-of-the-omnitrix",
    season: 0,
    episode_number: null,
    episode_type: "movie",
    synopsis:
      "With the Omnitrix set to self-destruct, Ben loses access to his aliens and goes searching for the device's creator.",
    thumbnail: ART.movies,
    quality: "1080p",
    duration_minutes: 75,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-10-05",
    aired_date: "2007-08-10",
    tags: "movie,omnitrix,origin",
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
    title: "Race Against Time",
    subtitle: "Feature Film",
    slug: "race-against-time",
    season: 0,
    episode_number: null,
    episode_type: "movie",
    synopsis:
      "A twisted force is rewriting time itself, and Ben has to race across the clock to stop it before everything he knows is erased.",
    thumbnail: ART.movies,
    quality: "1080p",
    duration_minutes: 90,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-10-19",
    aired_date: "2007-11-21",
    tags: "movie,time,traveller",
    views: 38990,
    links: [
      { label: "1080p", url: "https://t.me/ben10sl/63", size: 2420 },
      { label: "720p", url: "https://t.me/ben10sl/64", size: 1320 },
    ],
  },
  {
    category: "movies-specials",
    code: "B10-MV-003",
    title: "Alien Swarm",
    subtitle: "Feature Film",
    slug: "alien-swarm",
    season: 0,
    episode_number: null,
    episode_type: "movie",
    synopsis:
      "Alien eggs fall from the sky and spread across the city. Ben and his team have to move fast to stop the swarm before it takes over.",
    thumbnail: ART.movies,
    quality: "1080p",
    duration_minutes: 70,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-11-02",
    aired_date: "2009-11-25",
    tags: "movie,swarm,aliens",
    views: 31550,
    links: [
      { label: "1080p", url: "https://t.me/ben10sl/65", size: 2040 },
      { label: "720p", url: "https://t.me/ben10sl/66", size: 1110 },
    ],
  },
  {
    category: "movies-specials",
    code: "B10-MV-004",
    title: "Destroy All Aliens",
    subtitle: "Feature Film",
    slug: "destroy-all-aliens",
    season: 0,
    episode_number: null,
    episode_type: "movie",
    synopsis:
      "Anti-alien weapons come back to life, and Ben has to fight his own powers to save every alien on Earth.",
    thumbnail: ART.movies,
    quality: "1080p",
    duration_minutes: 68,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-11-16",
    aired_date: "2012-03-23",
    tags: "movie,aliens,fight",
    views: 27330,
    links: [{ label: "1080p", url: "https://t.me/ben10sl/67", size: 1980 }],
  },
  {
    category: "movies-specials",
    code: "B10-MV-005",
    title: "Ben 10 vs. The Universe",
    subtitle: "Feature Film",
    slug: "ben-10-vs-the-universe",
    season: 0,
    episode_number: null,
    episode_type: "movie",
    synopsis:
      "The fate of the universe is decided in one massive battle, as Ben pushes every single alien form to its limit.",
    thumbnail: ART.movies,
    quality: "1080p",
    duration_minutes: 72,
    dubbed_studio: STUDIO,
    dubbed_date: "2024-12-07",
    aired_date: "2020-10-11",
    tags: "movie,universe,finale",
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
  site_tagline: "Sinhala Dubbed Episodes",
  site_description:
    "Every Ben 10 episode and movie, fully dubbed in Sinhala. Free to stream and download, organised by series.",
  logo_url: "https://i.ibb.co/99p93Zfc/file-66.jpg",
  logo_text: "Ben 10 SL",
  announcement: "🎬 New this week — every Ben 10 movie is now streaming with Sinhala audio!",
  hero_kicker: "100% Sinhala Dub",
  hero_title: "Every Ben 10 Series in Sinhala",
  hero_subtitle:
    "From Classic to Omniverse — every episode and movie, fully dubbed in Sinhala and free to watch.",
  hero_image: "/art/hero-alien-tech.jpg",
  // paste a Sinhala dubbed YouTube link from the admin panel to fill the home-page player
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

/**
 * Explicit ids keep the seed deterministic (the same ids in every database) and
 * let the demo archive be inserted as one transaction without any round trip to
 * read generated keys back. `ON CONFLICT DO NOTHING` makes it re-runnable, so two
 * cold starts racing on an empty database cannot fail each other.
 */
function seedStatements(): Statement[] {
  const statements: Statement[] = [];

  CATEGORY_SEED.forEach((category, index) => {
    statements.push({
      text: `INSERT INTO categories (id, name, name_alt, slug, description, accent, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT DO NOTHING`,
      params: [
        index + 1,
        category.name,
        category.name_alt,
        category.slug,
        category.description,
        category.accent,
        category.sort_order,
      ],
    });
  });

  let releaseId = 0;
  let qualityId = 0;
  for (const release of seedReleases) {
    releaseId += 1;
    statements.push({
      text: `INSERT INTO releases (
               id, category_id, code, title, subtitle, slug, season, episode_number,
               episode_type, synopsis, thumbnail, quality, duration_minutes, dubbed_studio,
               dubbed_date, aired_date, telegram_url, source, language, tags, views,
               featured, status
             ) VALUES (
               $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
               $15, $16, $17, $18, 'sinhala', $19, $20, $21, 'published'
             )
             ON CONFLICT DO NOTHING`,
      params: [
        releaseId,
        categoryIdFor(release.category),
        release.code,
        release.title,
        release.subtitle,
        release.slug,
        release.season,
        release.episode_number,
        release.episode_type,
        release.synopsis,
        release.thumbnail,
        release.quality,
        release.duration_minutes,
        release.dubbed_studio,
        release.dubbed_date,
        release.aired_date,
        "https://t.me/ben10sl",
        "Cartoon Network (Sinhala dub)",
        release.tags,
        release.views,
        release.featured ? 1 : 0,
      ],
    });

    release.links.forEach((link, index) => {
      qualityId += 1;
      statements.push({
        text: `INSERT INTO qualities (id, release_id, label, url, file_size_mb, position)
               VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT DO NOTHING`,
        params: [qualityId, releaseId, link.label, link.url, link.size, index],
      });
    });
  }

  // move the identity sequences past the seeded ids so admin-created rows continue cleanly
  for (const table of ["categories", "releases", "qualities"]) {
    statements.push({
      text: `SELECT setval(
               pg_get_serial_sequence('${table}', 'id'),
               (SELECT COALESCE(MAX(id), 1) FROM ${table}),
               true
             )`,
    });
  }

  return statements;
}

function categoryIdFor(slug: string): number {
  const index = CATEGORY_SEED.findIndex((category) => category.slug === slug);
  return index >= 0 ? index + 1 : 1;
}

const SETTINGS_SEED_STATEMENTS: Statement[] = Object.entries(SETTINGS_SEED).map(([key, value]) => ({
  text: `INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
  params: [key, value],
}));

/** Creates the schema (idempotent) and seeds the archive when it is empty. */
async function ensureDatabase(driver: Driver): Promise<void> {
  console.log(
    `[Ben 10 SL] database ready (${driver.label}${driver.label === "pglite" ? " — local development fallback" : ""})`,
  );

  await driver.transaction([...SCHEMA, ...SETTINGS_SEED_STATEMENTS]);

  const [row] = await driver.query<{ c: number }>("SELECT COUNT(*)::int AS c FROM categories", []);
  if ((row?.c ?? 0) === 0) {
    await driver.transaction(seedStatements());
  }
}
