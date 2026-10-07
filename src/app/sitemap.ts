import type { MetadataRoute } from "next";

import { listCategories, listReleases } from "@/lib/queries";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const now = new Date();

  const staticRoutes = ["", "/releases", "/movies", "/about", "/how-to-download"].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const categoryRoutes = listCategories().map((category) => ({
    url: `${base}/category/${category.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const releaseRoutes = listReleases({ status: "published", perPage: 60 })
    .items.map((release) => ({
      url: `${base}/release/${release.slug}`,
      lastModified: new Date(release.updated_at.replace(" ", "T") + "Z"),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  if (getSetting("telegram_url")) {
    // settings are read so the sitemap regenerates whenever the site config changes
  }

  return [...staticRoutes, ...categoryRoutes, ...releaseRoutes];
}
