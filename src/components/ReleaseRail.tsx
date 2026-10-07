import Link from "next/link";
import type { ReleaseWithMeta } from "@/lib/types";
import { episodeLabel, formatViews } from "@/lib/utils";

/** Horizontally scrolling strip — used for trending and movie rails. */
export default function ReleaseRail({
  title,
  kicker,
  releases,
  href,
  accent = "#39FF14",
}: {
  title: string;
  kicker?: string;
  releases: ReleaseWithMeta[];
  href: string;
  accent?: string;
}) {
  if (releases.length === 0) return null;

  return (
    <section className="relative">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          {kicker ? (
            <p className="mb-2 text-[0.66rem] font-black tracking-[0.32em] uppercase" style={{ color: accent }}>
              {kicker}
            </p>
          ) : null}
          <h2 className="font-display text-xl font-black text-white sm:text-2xl">{title}</h2>
        </div>
        <Link
          href={href}
          className="shrink-0 rounded-full border border-omni-400/35 px-4 py-2 text-xs font-black tracking-wider text-omni-300 uppercase transition-colors hover:border-omni-400 hover:bg-omni-400/10"
        >
          සියල්ල →
        </Link>
      </div>

      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {releases.map((release, index) => (
          <Link
            key={release.id}
            href={`/release/${release.slug}`}
            className="panel panel-hover group relative w-[280px] shrink-0 snap-start overflow-hidden"
          >
            <div className="relative aspect-video overflow-hidden">
              {release.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={release.thumbnail}
                  alt={release.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="hex-grid h-full w-full" />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-void-950 via-transparent to-transparent" />
              <span className="absolute top-3 left-3 rounded-full bg-void-950/80 px-2.5 py-1 font-display text-[0.62rem] font-black tracking-wider text-omni-300">
                #{index + 1}
              </span>
              <span className="absolute bottom-3 left-3 rounded-full bg-omni-400/90 px-2.5 py-0.5 text-[0.6rem] font-black tracking-wider text-void-950 uppercase">
                සිංහල
              </span>
            </div>
            <div className="space-y-1 p-4">
              <h3 className="line-clamp-2 font-display text-sm leading-snug font-bold text-white group-hover:text-omni-300">
                {release.title}
              </h3>
              <p className="text-[0.68rem] font-bold tracking-wider text-void-200 uppercase">
                {episodeLabel(release)} · {formatViews(release.views)} නැරඹුම්
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
