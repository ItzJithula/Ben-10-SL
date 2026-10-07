import Link from "next/link";
import type { ReleaseWithMeta } from "@/lib/types";
import { episodeLabel, parseYoutubeId } from "@/lib/utils";
import { WatchFrame } from "./OmnitrixWatch";
import Reveal from "./Reveal";

/**
 * Featured slot on the home page. Plays the Sinhala dubbed clip straight from the
 * configured YouTube video and links to the hand-picked release below the fold.
 */
export default function FeaturedPlayer({
  release,
  youtubeUrl,
}: {
  release: ReleaseWithMeta | null;
  youtubeUrl: string;
}) {
  const videoId = parseYoutubeId(youtubeUrl);

  return (
    <Reveal direction="scale">
      <WatchFrame>
        <div className="grid gap-0 lg:grid-cols-[1.55fr_1fr]">
          <div className="relative aspect-video bg-void-950">
            {videoId ? (
              <iframe
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&color=white`}
                title="සිංහල හඬකැවීම — විශේෂ නිකුතුව"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            ) : release?.thumbnail ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={release.thumbnail} alt={release.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-void-950/60">
                  <span className="rounded-full border border-omni-400/50 bg-void-950/80 px-5 py-2 text-xs font-black tracking-[0.24em] text-omni-300 uppercase">
                    වීඩියෝව ඉක්මනින්
                  </span>
                </div>
              </>
            ) : (
              <div className="hex-grid h-full w-full" />
            )}
          </div>

          <div className="flex flex-col justify-center gap-4 border-t border-omni-400/20 bg-void-950/70 p-6 sm:p-8 lg:border-t-0 lg:border-l">
            <p className="flex items-center gap-2 text-[0.64rem] font-black tracking-[0.3em] text-omni-300 uppercase">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-omni-400" />
              සතියේ තෝරාගත් නිකුතුව
            </p>

            {release ? (
              <>
                <h3 className="font-display text-xl leading-snug font-black text-white sm:text-2xl">
                  {release.title}
                </h3>
                <p className="text-xs font-bold tracking-[0.2em] text-void-200 uppercase">
                  {release.title_en} · {episodeLabel(release)}
                </p>
                <p className="line-clamp-3 text-sm leading-relaxed text-void-100">
                  {release.synopsis}
                </p>
                <div className="flex flex-wrap gap-2 text-[0.65rem] font-bold tracking-wider uppercase">
                  <span
                    className="rounded-full px-3 py-1"
                    style={{
                      color: release.category_accent,
                      background: `${release.category_accent}18`,
                      border: `1px solid ${release.category_accent}44`,
                    }}
                  >
                    {release.category_name}
                  </span>
                  <span className="rounded-full border border-omni-400/35 px-3 py-1 text-omni-300">
                    {release.quality}
                  </span>
                  <span className="rounded-full border border-void-500 px-3 py-1 text-void-100">
                    සිංහල හඬකැවීම
                  </span>
                </div>
                <Link
                  href={`/release/${release.slug}`}
                  className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-omni-400/45 px-5 py-2.5 text-sm font-black tracking-wider text-omni-200 uppercase transition-colors hover:border-omni-400 hover:bg-omni-400/10"
                >
                  විස්තර හා බාගැනීම්
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </>
            ) : (
              <p className="text-sm text-void-100">තවම නිකුතු එකතු කර නැත.</p>
            )}
          </div>
        </div>
      </WatchFrame>
    </Reveal>
  );
}
