import type { MetadataRoute } from "next";

import { listCategories, listReleases } from "@/lib/queries";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Safe parse of a `YYYY-MM-DD HH:MM:SS` (or ISO) timestamp from the database. */
function safeDate(value: string | null | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const iso = value.length <= 10 ? `${value}T00:00:00Z` : `${value.replace(" ", "T")}Z`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const now = new Date();

  const staticRoutes = ["", "/releases", "/movies", "/about", "/how-to-download"].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  // A database hiccup must never turn the sitemap into a 500 for crawlers —
  // the static routes are always valid, so fall back to just those.
  try {
    const categories = await listCategories();
    const categoryRoutes = categories.map((category) => ({
      url: `${base}/category/${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    const releases = (await listReleases({ status: "published", perPage: 60 })).items;
    const releaseRoutes = releases.map((release) => ({
      url: `${base}/release/${release.slug}`,
      lastModified: safeDate(release.updated_at, now),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    // reading a setting keeps the sitemap in sync with the site configuration
    await getSetting("telegram_url");

    return [...staticRoutes, ...categoryRoutes, ...releaseRoutes];
  } catch (error) {
    console.error("[Ben 10 SL] sitemap: database unavailable, serving static routes only", error);
    return staticRoutes;
  }
}
