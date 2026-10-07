import type { Metadata } from "next";
import Link from "next/link";

import Reveal from "@/components/Reveal";
import { getAdminStats } from "@/lib/queries";
import { formatDateLong, formatViews, truncate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();
  const maxCount = Math.max(1, ...stats.perCategory.map((item) => item.count));

  const cards = [
    { label: "Total releases", value: stats.releases, accent: "#39FF14", hint: "across all collections" },
    { label: "Published", value: stats.published, accent: "#00E5FF", hint: "visible on the site" },
    { label: "Drafts", value: stats.drafts, accent: "#FFC400", hint: "not published yet" },
    { label: "Collections", value: stats.categories, accent: "#B026FF", hint: "main series" },
    { label: "Movies", value: stats.movieCount, accent: "#FF2E88", hint: "feature length" },
    { label: "Download links", value: stats.linkCount, accent: "#FF7A00", hint: "all qualities" },
    { label: "Total views", value: formatViews(stats.totalViews), accent: "#7DFF3D", hint: "all releases" },
    { label: "Today", value: new Date().getDate(), accent: "#00E5FF", hint: "daily check-in" },
  ];

  return (
    <div className="space-y-8">
      <Reveal>
        <div className="panel flex flex-wrap items-center justify-between gap-5 p-6">
          <div>
            <p className="text-[0.66rem] font-black tracking-[0.3em] text-omni-400 uppercase">
              Admin panel
            </p>
            <h1 className="mt-2 font-display text-2xl font-black text-white">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-void-100">
              Add new releases, manage your collections, or update the site information from here.
            </p>
          </div>
          <Link
            href="/admin/releases/new"
            className="rounded-full bg-linear-to-r from-omni-300 via-omni-400 to-omni-600 px-6 py-3 font-display text-xs font-black tracking-[0.2em] text-void-950 uppercase shadow-omni transition-transform hover:scale-[1.03]"
          >
            + New release
          </Link>
        </div>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Reveal key={card.label}>
            <div
              className="panel relative overflow-hidden p-5"
              style={{ borderColor: `${card.accent}33` }}
            >
              <span
                className="absolute -top-10 -right-10 h-24 w-24 rounded-full opacity-20 blur-2xl"
                style={{ background: card.accent }}
              />
              <p className="text-[0.62rem] font-black tracking-[0.24em] text-void-200 uppercase">
                {card.label}
              </p>
              <p className="mt-2 font-display text-3xl font-black" style={{ color: card.accent }}>
                {card.value}
              </p>
              <p className="mt-1 text-[0.68rem] text-void-300">{card.hint}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="panel p-6">
            <h2 className="mb-5 font-display text-sm font-black tracking-[0.2em] text-omni-300 uppercase">
              Releases by collection
            </h2>
            <div className="space-y-4">
              {stats.perCategory.map((item) => (
                <div key={item.slug}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <Link
                      href={`/category/${item.slug}`}
                      className="font-bold text-void-50 hover:text-omni-300"
                    >
                      {item.name_alt || item.name}
                    </Link>
                    <span className="font-black" style={{ color: item.accent }}>
                      {item.count}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-void-700">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(item.count / maxCount) * 100}%`,
                        background: `linear-gradient(90deg, ${item.accent}, ${item.accent}55)`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="panel p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-sm font-black tracking-[0.2em] text-omni-300 uppercase">
                Latest releases
              </h2>
              <Link
                href="/admin/releases"
                className="text-[0.68rem] font-black tracking-wider text-omni-400 uppercase hover:text-omni-300"
              >
                View all →
              </Link>
            </div>

            <div className="space-y-3">
              {stats.latest.map((release) => (
                <Link
                  key={release.id}
                  href={`/admin/releases/${release.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-void-700 p-2.5 transition-colors hover:border-omni-400/50 hover:bg-omni-400/5"
                >
                  <span className="h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-void-800">
                    {release.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={release.thumbnail}
                        alt={release.title}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 block text-sm font-bold text-white group-hover:text-omni-300">
                      {release.title}
                    </span>
                    <span className="mt-0.5 block text-[0.66rem] text-void-200">
                      {release.category_name} · {release.status === "published" ? "Published" : "Draft"} ·{" "}
                      {formatDateLong(release.created_at)}
                    </span>
                  </span>
                </Link>
              ))}

              {stats.latest.length === 0 ? (
                <p className="text-sm text-void-200">Nothing here yet — add your first release.</p>
              ) : null}
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal>
        <div className="panel p-6">
          <h2 className="mb-4 font-display text-sm font-black tracking-[0.2em] text-omni-300 uppercase">
            Quick actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/releases/new"
              className="rounded-full border border-omni-400/40 px-5 py-2.5 text-xs font-black tracking-wider text-omni-300 uppercase transition-colors hover:bg-omni-400/10"
            >
              New release
            </Link>
            <Link
              href="/admin/categories"
              className="rounded-full border border-omni-400/40 px-5 py-2.5 text-xs font-black tracking-wider text-omni-300 uppercase transition-colors hover:bg-omni-400/10"
            >
              Add a collection
            </Link>
            <Link
              href="/admin/settings"
              className="rounded-full border border-omni-400/40 px-5 py-2.5 text-xs font-black tracking-wider text-omni-300 uppercase transition-colors hover:bg-omni-400/10"
            >
              Site settings
            </Link>
            <Link
              href="/"
              className="rounded-full border border-void-500 px-5 py-2.5 text-xs font-black tracking-wider text-void-100 uppercase transition-colors hover:border-omni-400/50 hover:text-omni-300"
            >
              View live site
            </Link>
          </div>
          <p className="mt-5 rounded-xl border border-void-600 bg-void-950/60 p-4 text-[0.7rem] leading-relaxed text-void-200">
            <strong className="text-void-100">Note:</strong> {truncate(
              "Every release is stored as a Sinhala dub. Release codes must be unique — do not use the same code twice.",
              140,
            )}
          </p>
        </div>
      </Reveal>
    </div>
  );
}
