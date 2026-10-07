import Link from "next/link";
import type { ReleaseWithMeta } from "@/lib/types";
import { episodeLabel, formatViews } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  episode: "Episode",
  movie: "Movie",
  special: "Special",
  short: "Short",
};

export default function ReleaseCard({
  release,
  compact = false,
}: {
  release: ReleaseWithMeta;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/release/${release.slug}`}
      className="panel panel-hover group relative block overflow-hidden"
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
          <div className="hex-grid h-full w-full bg-void-800" />
        )}

        <div className="absolute inset-0 bg-linear-to-t from-void-950 via-void-950/35 to-transparent" />

        {/* top row chips */}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <span
            className="rounded-full px-2.5 py-1 text-[0.62rem] font-black tracking-[0.16em] uppercase backdrop-blur-sm"
            style={{
              color: release.category_accent,
              background: "rgba(3,5,4,0.72)",
              border: `1px solid ${release.category_accent}55`,
            }}
          >
            {release.code || TYPE_LABEL[release.episode_type]}
          </span>
          <span className="flex items-center gap-1 rounded-full border border-omni-400/40 bg-void-950/80 px-2.5 py-1 text-[0.62rem] font-bold text-omni-300 backdrop-blur-sm">
            <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current">
              <path d="M4 14h4v6H4zM10 9h4v11h-4zM16 4h4v16h-4z" />
            </svg>
            {release.quality}
          </span>
        </div>

        {/* language badge — everything here is Sinhala dubbed */}
        <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-omni-400/90 px-2.5 py-1 text-[0.62rem] font-black tracking-wider text-void-950 uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-void-950" />
          Sinhala Dub
        </span>

        {/* play overlay */}
        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-omni-300 bg-void-950/70 backdrop-blur-sm">
            <span className="absolute inset-0 rounded-full border border-omni-400/60 animate-pulse-ring" />
            <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-omni-300">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      </div>

      <div className="relative space-y-2 p-4">
        <h3 className="line-clamp-2 font-display text-[0.98rem] leading-snug font-bold text-white transition-colors group-hover:text-omni-300">
          {release.title}
        </h3>

        {!compact && release.subtitle ? (
          <p className="line-clamp-1 text-xs tracking-wide text-void-200">{release.subtitle}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[0.7rem] font-semibold tracking-wide text-void-200 uppercase">
          {release.episode_type === "episode" ? (
            <span className="text-omni-300/90">{episodeLabel(release)}</span>
          ) : (
            <span className="text-omni-300/90">{TYPE_LABEL[release.episode_type]}</span>
          )}
          <span className="flex items-center gap-1">
            <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current opacity-70">
              <path d="M12 5c-5 0-9 4.5-9 7s4 7 9 7 9-4.5 9-7-4-7-9-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
            </svg>
            {formatViews(release.views)}
          </span>
          {release.link_count > 0 ? (
            <span className="flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current opacity-70">
                <path d="M10.6 13.4a1 1 0 0 0 1.4 0l3-3a3 3 0 0 0-4.2-4.2l-1 1 1.4 1.4 1-1a1 1 0 0 1 1.4 1.4l-3 3a1 1 0 0 0 0 1.4Zm2.8-2.8a1 1 0 0 0-1.4 0l-3 3a3 3 0 0 0 4.2 4.2l1-1-1.4-1.4-1 1a1 1 0 0 1-1.4-1.4l3-3a1 1 0 0 0 0-1.4Z" />
              </svg>
              {release.link_count} links
            </span>
          ) : null}
          {release.featured === 1 ? (
            <span className="ml-auto flex items-center gap-1 text-omni-300">
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current">
                <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9Z" />
              </svg>
              Featured
            </span>
          ) : null}
        </div>
      </div>

      <span
        className="absolute inset-x-0 bottom-0 h-[2px] scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
        style={{ background: `linear-gradient(90deg, transparent, ${release.category_accent}, transparent)` }}
      />
    </Link>
  );
}
