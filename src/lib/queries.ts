import { getDb } from "./db";
import type {
  AdminStats,
  CategoryWithCount,
  Paginated,
  ReleaseDetail,
  ReleaseFilters,
  ReleaseWithMeta,
} from "./types";

const RELEASE_SELECT = `
  SELECT r.*,
         c.name  AS category_name,
         c.name_si AS category_name_si,
         c.slug  AS category_slug,
         c.accent AS category_accent,
         (SELECT COUNT(*) FROM qualities q WHERE q.release_id = r.id) AS link_count
  FROM releases r
  JOIN categories c ON c.id = r.category_id
`;

const SORT_MAP: Record<string, string> = {
  newest: "r.created_at DESC, r.id DESC",
  oldest: "r.created_at ASC, r.id ASC",
  views: "r.views DESC, r.id DESC",
  title: "r.title_en ASC",
  episode: "r.season ASC, COALESCE(r.episode_number, 0) ASC, r.id ASC",
  featured: "r.featured DESC, r.created_at DESC",
};

export function listReleases(filters: ReleaseFilters = {}): Paginated<ReleaseWithMeta> {
  const db = getDb();
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(60, Math.max(1, filters.perPage ?? 12));

  const where: string[] = [];
  const params: (string | number)[] = [];

  if (filters.q?.trim()) {
    where.push("(r.title LIKE ? OR r.title_en LIKE ? OR r.tags LIKE ? OR r.code LIKE ? OR r.synopsis LIKE ?)");
    const needle = `%${filters.q.trim()}%`;
    params.push(needle, needle, needle, needle, needle);
  }
  if (filters.category && filters.category !== "all") {
    where.push("c.slug = ?");
    params.push(filters.category);
  }
  if (filters.type && filters.type !== "all") {
    where.push("r.episode_type = ?");
    params.push(filters.type);
  }
  if (filters.status && filters.status !== "all") {
    where.push("r.status = ?");
    params.push(filters.status);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const orderSql = SORT_MAP[filters.sort ?? ""] ?? SORT_MAP.newest;

  const total = (
    db
      .prepare(
        `SELECT COUNT(*) AS c FROM releases r JOIN categories c ON c.id = r.category_id ${whereSql}`,
      )
      .get(...params) as { c: number }
  ).c;

  const items = db
    .prepare(`${RELEASE_SELECT} ${whereSql} ORDER BY ${orderSql} LIMIT ? OFFSET ?`)
    .all(...params, perPage, (page - 1) * perPage) as ReleaseWithMeta[];

  return {
    items,
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export function getReleaseBySlug(slug: string): ReleaseDetail | null {
  const db = getDb();
  const release = db.prepare(`${RELEASE_SELECT} WHERE r.slug = ?`).get(slug) as
    | ReleaseWithMeta
    | undefined;
  if (!release) return null;
  const qualities = db
    .prepare("SELECT * FROM qualities WHERE release_id = ? ORDER BY position ASC, id ASC")
    .all(release.id);
  return { ...release, qualities } as ReleaseDetail;
}

export function getReleaseById(id: number): ReleaseDetail | null {
  const db = getDb();
  const release = db.prepare(`${RELEASE_SELECT} WHERE r.id = ?`).get(id) as
    | ReleaseWithMeta
    | undefined;
  if (!release) return null;
  const qualities = db
    .prepare("SELECT * FROM qualities WHERE release_id = ? ORDER BY position ASC, id ASC")
    .all(release.id);
  return { ...release, qualities } as ReleaseDetail;
}

/** Previous / next episode inside the same collection, ordered like the series. */
export function getNeighbours(release: ReleaseDetail) {
  const db = getDb();
  const prev = db
    .prepare(
      `${RELEASE_SELECT}
       WHERE r.category_id = ? AND r.id <> ? AND (
         r.season < ? OR (r.season = ? AND COALESCE(r.episode_number, 0) < COALESCE(?, 0))
       )
       ORDER BY r.season DESC, COALESCE(r.episode_number, 0) DESC LIMIT 1`,
    )
    .get(
      release.category_id,
      release.id,
      release.season,
      release.season,
      release.episode_number,
    ) as ReleaseWithMeta | undefined;

  const next = db
    .prepare(
      `${RELEASE_SELECT}
       WHERE r.category_id = ? AND r.id <> ? AND (
         r.season > ? OR (r.season = ? AND COALESCE(r.episode_number, 0) > COALESCE(?, 0))
       )
       ORDER BY r.season ASC, COALESCE(r.episode_number, 0) ASC LIMIT 1`,
    )
    .get(
      release.category_id,
      release.id,
      release.season,
      release.season,
      release.episode_number,
    ) as ReleaseWithMeta | undefined;

  return { prev: prev ?? null, next: next ?? null };
}

export function getRelatedReleases(release: ReleaseDetail, limit = 4): ReleaseWithMeta[] {
  return getDb()
    .prepare(
      `${RELEASE_SELECT}
       WHERE r.category_id = ? AND r.id <> ? AND r.status = 'published'
       ORDER BY ABS(COALESCE(r.episode_number, 0) - COALESCE(?, 0)) ASC, r.views DESC
       LIMIT ?`,
    )
    .all(release.category_id, release.id, release.episode_number, limit) as ReleaseWithMeta[];
}

export function listCategories(): CategoryWithCount[] {
  return getDb()
    .prepare(
      `SELECT c.*, (
         SELECT COUNT(*) FROM releases r
         WHERE r.category_id = c.id AND r.status = 'published'
       ) AS release_count
       FROM categories c
       ORDER BY c.sort_order ASC, c.id ASC`,
    )
    .all() as CategoryWithCount[];
}

export function getCategoryBySlug(slug: string): CategoryWithCount | null {
  const category = getDb()
    .prepare(
      `SELECT c.*, (
         SELECT COUNT(*) FROM releases r
         WHERE r.category_id = c.id AND r.status = 'published'
       ) AS release_count
       FROM categories c WHERE c.slug = ?`,
    )
    .get(slug) as CategoryWithCount | undefined;
  return category ?? null;
}

export function getFeatured(limit = 5): ReleaseWithMeta[] {
  return getDb()
    .prepare(
      `${RELEASE_SELECT}
       WHERE r.status = 'published'
       ORDER BY r.featured DESC, r.views DESC, r.created_at DESC LIMIT ?`,
    )
    .all(limit) as ReleaseWithMeta[];
}

export function getTrending(limit = 8): ReleaseWithMeta[] {
  return getDb()
    .prepare(
      `${RELEASE_SELECT} WHERE r.status = 'published' ORDER BY r.views DESC, r.id DESC LIMIT ?`,
    )
    .all(limit) as ReleaseWithMeta[];
}

export function getLatest(limit = 8): ReleaseWithMeta[] {
  return getDb()
    .prepare(`${RELEASE_SELECT} WHERE r.status = 'published' ORDER BY r.created_at DESC, r.id DESC LIMIT ?`)
    .all(limit) as ReleaseWithMeta[];
}

export function getMovies(limit = 6): ReleaseWithMeta[] {
  return getDb()
    .prepare(
      `${RELEASE_SELECT} WHERE r.episode_type = 'movie' AND r.status = 'published'
       ORDER BY r.created_at DESC LIMIT ?`,
    )
    .all(limit) as ReleaseWithMeta[];
}

export function incrementViews(id: number): void {
  getDb().prepare("UPDATE releases SET views = views + 1 WHERE id = ?").run(id);
}

export function getSiteStats() {
  const db = getDb();
  const releases = (db.prepare("SELECT COUNT(*) AS c FROM releases WHERE status='published'").get() as { c: number }).c;
  const episodes = (
    db.prepare("SELECT COUNT(*) AS c FROM releases WHERE status='published' AND episode_type='episode'").get() as { c: number }
  ).c;
  const movies = (
    db.prepare("SELECT COUNT(*) AS c FROM releases WHERE status='published' AND episode_type='movie'").get() as { c: number }
  ).c;
  const dubbedMinutes = (
    db.prepare("SELECT COALESCE(SUM(duration_minutes),0) AS c FROM releases WHERE status='published'").get() as { c: number }
  ).c;
  return { releases, episodes, movies, dubbedMinutes };
}

export function getAdminStats(): AdminStats {
  const db = getDb();
  const releases = (db.prepare("SELECT COUNT(*) AS c FROM releases").get() as { c: number }).c;
  const published = (db.prepare("SELECT COUNT(*) AS c FROM releases WHERE status='published'").get() as { c: number }).c;
  const categories = (db.prepare("SELECT COUNT(*) AS c FROM categories").get() as { c: number }).c;
  const movieCount = (db.prepare("SELECT COUNT(*) AS c FROM releases WHERE episode_type='movie'").get() as { c: number }).c;
  const totalViews = (db.prepare("SELECT COALESCE(SUM(views),0) AS c FROM releases").get() as { c: number }).c;
  const linkCount = (db.prepare("SELECT COUNT(*) AS c FROM qualities").get() as { c: number }).c;

  const perCategory = db
    .prepare(
      `SELECT c.name, c.name_si, c.slug, c.accent, (
         SELECT COUNT(*) FROM releases r WHERE r.category_id = c.id
       ) AS count
       FROM categories c ORDER BY c.sort_order ASC, c.id ASC`,
    )
    .all() as AdminStats["perCategory"];

  return {
    releases,
    published,
    drafts: releases - published,
    categories,
    movieCount,
    totalViews,
    linkCount,
    perCategory,
    latest: getLatest(6),
  };
}
