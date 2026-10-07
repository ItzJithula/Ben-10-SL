/** Small helpers shared by server + client components. */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\u0D80-\u0DFF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return base || `release-${Date.now().toString(36)}`;
}

export function formatDateLong(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value.length <= 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return value;
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export function formatDateIso(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value.length <= 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

export function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return `${views}`;
}

export function formatSize(mb?: number | null): string {
  if (!mb || mb <= 0) return "—";
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${Math.round(mb)} MB`;
}

export function totalSize(qualities: { file_size_mb: number | null }[]): number {
  return qualities.reduce((sum, q) => sum + (q.file_size_mb ?? 0), 0);
}

export function episodeLabel(release: {
  episode_type: string;
  season: number;
  episode_number: number | null;
}): string {
  if (release.episode_type === "movie") return "Movie";
  if (release.episode_type === "short") return "Short";
  if (release.episode_type === "special") return "Special";
  const ep = release.episode_number ?? 0;
  return `Season ${release.season} · Episode ${ep}`;
}

export function episodeCodeShort(release: { code: string }): string {
  return release.code.toUpperCase();
}

export function cx(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

export function parseTags(tags: string): string[] {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function toInt(value: unknown): number {
  const n = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : 0;
}

export function parseYoutubeId(url: string): string | null {
  const value = (url ?? "").trim();
  if (!value) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?[^#]*v=)([A-Za-z0-9_-]{6,})/,
    /(?:youtu\.be\/)([A-Za-z0-9_-]{6,})/,
    /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/,
    /(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]{6,})/,
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return match[1];
  }
  // allow passing the bare video id
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  return null;
}

export function truncate(text: string, length = 160): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length).trimEnd()}…`;
}
