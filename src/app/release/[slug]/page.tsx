import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import PlayerCard from "@/components/PlayerCard";
import ReleaseCard from "@/components/ReleaseCard";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import ViewPing from "@/components/ViewPing";
import { WatchFrame } from "@/components/OmnitrixWatch";
import { getNeighbours, getRelatedReleases, getReleaseBySlug } from "@/lib/queries";
import { episodeLabel, formatDateLong, formatViews, parseTags, truncate } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const release = await getReleaseBySlug(slug);
  if (!release) return { title: "Release not found" };
  return {
    title: `${release.title} — Sinhala Dub`,
    description: truncate(release.synopsis || release.title, 150),
    openGraph: {
      title: release.title,
      description: truncate(release.synopsis, 150),
      images: release.thumbnail ? [release.thumbnail] : undefined,
    },
  };
}

export default async function ReleasePage({ params }: { params: Params }) {
  const { slug } = await params;
  const release = await getReleaseBySlug(slug);
  if (!release) notFound();

  const [{ prev, next }, related] = await Promise.all([
    getNeighbours(release),
    getRelatedReleases(release, 4),
  ]);
  const tags = parseTags(release.tags);

  const details = [
    { label: "Release code", value: release.code || "—" },
    { label: "Collection", value: release.category_name },
    { label: "Type", value: episodeLabel(release) },
    { label: "Dub studio", value: release.dubbed_studio || "—" },
    { label: "Dubbed on", value: formatDateLong(release.dubbed_date) },
    { label: "Original air date", value: formatDateLong(release.aired_date) },
    { label: "Runtime", value: `${release.duration_minutes} min` },
    { label: "Views", value: formatViews(release.views) },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ViewPing releaseId={release.id} />

      {/* breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-[0.7rem] font-bold tracking-wider text-void-200 uppercase">
        <Link href="/" className="hover:text-omni-300">
          Home
        </Link>
        <span className="text-void-400">/</span>
        <Link href="/releases" className="hover:text-omni-300">
          Releases
        </Link>
        <span className="text-void-400">/</span>
        <Link href={`/category/${release.category_slug}`} className="hover:text-omni-300">
          {release.category_name}
        </Link>
        <span className="text-void-400">/</span>
        <span className="text-omni-300">{release.code}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Reveal>
            <div>
              <span
                className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.65rem] font-black tracking-[0.2em] uppercase"
                style={{
                  color: release.category_accent,
                  background: `${release.category_accent}16`,
                  border: `1px solid ${release.category_accent}55`,
                }}
              >
                {release.category_name}
              </span>
              <h1 className="font-display text-2xl leading-tight font-black text-white sm:text-4xl">
                {release.title}
              </h1>
              {release.subtitle ? (
                <p className="mt-2 text-sm font-bold tracking-[0.18em] text-void-200 uppercase">
                  {release.subtitle}
                </p>
              ) : null}
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <PlayerCard release={release} />
          </Reveal>

          <Reveal delay={0.1}>
            <div className="panel p-6">
              <h2 className="mb-3 font-display text-sm font-black tracking-[0.22em] text-omni-300 uppercase">
                Synopsis
              </h2>
              <p className="text-sm leading-relaxed whitespace-pre-line text-void-100">
                {release.synopsis || "No synopsis has been added yet."}
              </p>

              {tags.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/releases?q=${encodeURIComponent(tag)}`}
                      className="rounded-full border border-void-500 px-3 py-1 text-[0.68rem] font-bold text-void-100 transition-colors hover:border-omni-400/60 hover:text-omni-300"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </Reveal>

          {/* prev / next */}
          <div className="grid gap-4 sm:grid-cols-2">
            {prev ? (
              <Link href={`/release/${prev.slug}`} className="panel panel-hover flex items-center gap-4 p-4">
                <span className="text-omni-300">←</span>
                <span>
                  <span className="block text-[0.62rem] font-black tracking-[0.24em] text-void-200 uppercase">
                    Previous episode
                  </span>
                  <span className="line-clamp-1 font-display text-sm font-bold text-white">
                    {prev.title}
                  </span>
                </span>
              </Link>
            ) : (
              <span className="panel flex items-center p-4 text-xs text-void-300">
                This is the first release in the collection
              </span>
            )}

            {next ? (
              <Link
                href={`/release/${next.slug}`}
                className="panel panel-hover flex items-center justify-end gap-4 p-4 text-right"
              >
                <span>
                  <span className="block text-[0.62rem] font-black tracking-[0.24em] text-void-200 uppercase">
                    Next episode
                  </span>
                  <span className="line-clamp-1 font-display text-sm font-bold text-white">
                    {next.title}
                  </span>
                </span>
                <span className="text-omni-300">→</span>
              </Link>
            ) : (
              <span className="panel flex items-center justify-end p-4 text-xs text-void-300">
                This is the last release in the collection
              </span>
            )}
          </div>
        </div>

        {/* sidebar */}
        <aside className="space-y-6">
          <Reveal direction="left">
            <WatchFrame>
              <div className="p-5">
                <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-black tracking-[0.22em] text-omni-300 uppercase">
                  Release details
                </h2>
                <dl className="space-y-3 text-sm">
                  {details.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-start justify-between gap-4 border-b border-void-700/70 pb-2.5 last:border-0"
                    >
                      <dt className="text-[0.7rem] font-bold tracking-wider text-void-200 uppercase">
                        {item.label}
                      </dt>
                      <dd className="text-right font-semibold text-white">{item.value}</dd>
                    </div>
                  ))}
                </dl>

                {release.source ? (
                  <p className="mt-4 rounded-xl border border-void-600 bg-void-950/60 p-3 text-[0.72rem] leading-relaxed text-void-200">
                    Source: {release.source}
                  </p>
                ) : null}
              </div>
            </WatchFrame>
          </Reveal>

          {related.length > 0 ? (
            <Reveal direction="left" delay={0.08}>
              <div className="panel p-5">
                <h2 className="mb-4 font-display text-sm font-black tracking-[0.22em] text-omni-300 uppercase">
                  More from this collection
                </h2>
                <div className="space-y-3">
                  {related.map((item) => (
                    <Link
                      key={item.id}
                      href={`/release/${item.slug}`}
                      className="group flex items-center gap-3 rounded-xl border border-void-700 p-2.5 transition-colors hover:border-omni-400/50 hover:bg-omni-400/5"
                    >
                      <span className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-void-800">
                        {item.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 block text-xs font-bold text-white group-hover:text-omni-300">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-[0.65rem] font-bold tracking-wider text-void-200 uppercase">
                          {episodeLabel(item)}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </Reveal>
          ) : null}
        </aside>
      </div>

      {related.length > 0 ? (
        <section className="mt-16">
          <Reveal>
            <SectionHeading kicker="You may also like" title="More releases" />
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <Reveal key={item.id}>
                <ReleaseCard release={item} compact />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
