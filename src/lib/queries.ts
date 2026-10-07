import { query, queryOne } from "./db";
import type {
  AdminStats,
  CategoryWithCount,
  Paginated,
  Quality,
  ReleaseDetail,
  ReleaseFilters,
  ReleaseWithMeta,
} from "./types";

const RELEASE_SELECT = `
  SELECT r.*,
         c.name  AS category_name,
         c.name_alt AS category_name_alt,
         c.slug  AS category_slug,
         c.accent AS category_accent,
         (SELECT COUNT(*)::int FROM qualities q WHERE q.release_id = r.id) AS link_count
  FROM releases r
  JOIN categories c ON c.id = r.category_id
`;

const SORT_MAP: Record<string, string> = {
  newest: "r.created_at DESC, r.id DESC",
  oldest: "r.created_at ASC, r.id ASC",
  views: "r.views DESC, r.id DESC",
  title: "r.subtitle ASC",
  episode: "r.season ASC, COALESCE(r.episode_number, 0) ASC, r.id ASC",
  featured: "r.featured DESC, r.created_at DESC",
};

/**
 * Builds numbered placeholders (`$1`, `$2`, …) as parameters are pushed, so no
 * query in this file has to keep track of its own indexes.
 */
function collector() {
  const params: unknown[] = [];
  const add = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };
  return { params, add };
}

export async function listReleases(
  filters: ReleaseFilters = {},
): Promise<Paginated<ReleaseWithMeta>> {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(60, Math.max(1, filters.perPage ?? 12));

  const where: string[] = [];
  const { params, add } = collector();

  if (filters.q?.trim()) {
    // ILIKE keeps the archive search case-insensitive
    const needle = add(`%${filters.q.trim()}%`);
    where.push(
      `(r.title ILIKE ${needle} OR r.subtitle ILIKE ${needle} OR r.tags ILIKE ${needle} ` +
        `OR r.code ILIKE ${needle} OR r.synopsis ILIKE ${needle})`,
    );
  }
  if (filters.category && filters.category !== "all") {
    where.push(`c.slug = ${add(filters.category)}`);
  }
  if (filters.type && filters.type !== "all") {
    where.push(`r.episode_type = ${add(filters.type)}`);
  }
  if (filters.status && filters.status !== "all") {
    where.push(`r.status = ${add(filters.status)}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const orderSql = SORT_MAP[filters.sort ?? ""] ?? SORT_MAP.newest;

  const countSql = `SELECT COUNT(*)::int AS c FROM releases r JOIN categories c ON c.id = r.category_id ${whereSql}`;
  const listSql = `${RELEASE_SELECT} ${whereSql} ORDER BY ${orderSql} LIMIT ${add(perPage)} OFFSET ${add(
    (page - 1) * perPage,
  )}`;

  // the count shares the placeholders pushed before LIMIT/OFFSET, so strip them
  const countParams = params.slice(0, params.length - 2);

  const [totalRow, items] = await Promise.all([
    queryOne<{ c: number }>(countSql, countParams),
    query<ReleaseWithMeta>(listSql, params),
  ]);

  const total = totalRow?.c ?? 0;

  return {
    items,
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getReleaseBySlug(slug: string): Promise<ReleaseDetail | null> {
  return releaseWhere("r.slug = $1", [slug]);
}

export async function getReleaseById(id: number): Promise<ReleaseDetail | null> {
  return releaseWhere("r.id = $1", [id]);
}

async function releaseWhere(condition: string, params: unknown[]): Promise<ReleaseDetail | null> {
  const release = await queryOne<ReleaseWithMeta>(`${RELEASE_SELECT} WHERE ${condition}`, params);
  if (!release) return null;
  const qualities = await query<Quality>(
    "SELECT * FROM qualities WHERE release_id = $1 ORDER BY position ASC, id ASC",
    [release.id],
  );
  return { ...release, qualities };
}

/** Previous / next episode inside the same collection, ordered like the series. */
export async function getNeighbours(release: ReleaseDetail) {
  const [prev, next] = await Promise.all([
    queryOne<ReleaseWithMeta>(
      `${RELEASE_SELECT}
       WHERE r.category_id = $1 AND r.id <> $2 AND (
         r.season < $3 OR (r.season = $3 AND COALESCE(r.episode_number, 0) < COALESCE($4, 0))
       )
       ORDER BY r.season DESC, COALESCE(r.episode_number, 0) DESC LIMIT 1`,
      [release.category_id, release.id, release.season, release.episode_number],
    ),
    queryOne<ReleaseWithMeta>(
      `${RELEASE_SELECT}
       WHERE r.category_id = $1 AND r.id <> $2 AND (
         r.season > $3 OR (r.season = $3 AND COALESCE(r.episode_number, 0) > COALESCE($4, 0))
       )
       ORDER BY r.season ASC, COALESCE(r.episode_number, 0) ASC LIMIT 1`,
      [release.category_id, release.id, release.season, release.episode_number],
    ),
  ]);

  return { prev: prev ?? null, next: next ?? null };
}

export async function getRelatedReleases(
  release: ReleaseDetail,
  limit = 4,
): Promise<ReleaseWithMeta[]> {
  return query<ReleaseWithMeta>(
    `${RELEASE_SELECT}
     WHERE r.category_id = $1 AND r.id <> $2 AND r.status = 'published'
     ORDER BY ABS(COALESCE(r.episode_number, 0) - COALESCE($3, 0)) ASC, r.views DESC
     LIMIT $4`,
    [release.category_id, release.id, release.episode_number, limit],
  );
}

const CATEGORY_SELECT = `SELECT c.*, (
   SELECT COUNT(*)::int FROM releases r
   WHERE r.category_id = c.id AND r.status = 'published'
 ) AS release_count
 FROM categories c`;

export async function listCategories(): Promise<CategoryWithCount[]> {
  return query<CategoryWithCount>(`${CATEGORY_SELECT} ORDER BY c.sort_order ASC, c.id ASC`);
}

export async function getCategoryBySlug(slug: string): Promise<CategoryWithCount | null> {
  return queryOne<CategoryWithCount>(`${CATEGORY_SELECT} WHERE c.slug = $1`, [slug]);
}

export async function getFeatured(limit = 5): Promise<ReleaseWithMeta[]> {
  return query<ReleaseWithMeta>(
    `${RELEASE_SELECT}
     WHERE r.status = 'published'
     ORDER BY r.featured DESC, r.views DESC, r.created_at DESC LIMIT $1`,
    [limit],
  );
}

export async function getTrending(limit = 8): Promise<ReleaseWithMeta[]> {
  return query<ReleaseWithMeta>(
    `${RELEASE_SELECT} WHERE r.status = 'published' ORDER BY r.views DESC, r.id DESC LIMIT $1`,
    [limit],
  );
}

export async function getLatest(limit = 8): Promise<ReleaseWithMeta[]> {
  return query<ReleaseWithMeta>(
    `${RELEASE_SELECT} WHERE r.status = 'published' ORDER BY r.created_at DESC, r.id DESC LIMIT $1`,
    [limit],
  );
}

export async function getMovies(limit = 6): Promise<ReleaseWithMeta[]> {
  return query<ReleaseWithMeta>(
    `${RELEASE_SELECT} WHERE r.episode_type = 'movie' AND r.status = 'published'
     ORDER BY r.created_at DESC LIMIT $1`,
    [limit],
  );
}

export async function incrementViews(id: number): Promise<void> {
  await query("UPDATE releases SET views = views + 1 WHERE id = $1", [id]);
}

export async function getSiteStats() {
  const row = await queryOne<{
    releases: number;
    episodes: number;
    movies: number;
    dubbed_minutes: number;
  }>(
    `SELECT
       COUNT(*)::int AS releases,
       COUNT(*) FILTER (WHERE episode_type = 'episode')::int AS episodes,
       COUNT(*) FILTER (WHERE episode_type = 'movie')::int AS movies,
       COALESCE(SUM(duration_minutes), 0)::int AS dubbed_minutes
     FROM releases WHERE status = 'published'`,
  );

  return {
    releases: row?.releases ?? 0,
    episodes: row?.episodes ?? 0,
    movies: row?.movies ?? 0,
    dubbedMinutes: row?.dubbed_minutes ?? 0,
  };
}

export async function getAdminStats(): Promise<AdminStats> {
  const totals = await queryOne<{
    releases: number;
    published: number;
    categories: number;
    movies: number;
    views: number;
    links: number;
  }>(
    `SELECT
       (SELECT COUNT(*)::int FROM releases) AS releases,
       (SELECT COUNT(*)::int FROM releases WHERE status = 'published') AS published,
       (SELECT COUNT(*)::int FROM categories) AS categories,
       (SELECT COUNT(*)::int FROM releases WHERE episode_type = 'movie') AS movies,
       (SELECT COALESCE(SUM(views), 0)::int FROM releases) AS views,
       (SELECT COUNT(*)::int FROM qualities) AS links`,
  );

  const perCategory = await query<AdminStats["perCategory"][number]>(
    `SELECT c.name, c.name_alt, c.slug, c.accent, (
       SELECT COUNT(*)::int FROM releases r WHERE r.category_id = c.id
     ) AS count
     FROM categories c ORDER BY c.sort_order ASC, c.id ASC`,
  );

  const releases = totals?.releases ?? 0;
  const published = totals?.published ?? 0;

  return {
    releases,
    published,
    drafts: releases - published,
    categories: totals?.categories ?? 0,
    movieCount: totals?.movies ?? 0,
    totalViews: totals?.views ?? 0,
    linkCount: totals?.links ?? 0,
    perCategory,
    latest: await getLatest(6),
  };
}
