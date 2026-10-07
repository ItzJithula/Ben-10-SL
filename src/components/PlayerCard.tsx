"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { ReleaseDetail } from "@/lib/types";
import { cx, formatSize, parseYoutubeId, totalSize } from "@/lib/utils";

/**
 * Player + download panel for a single Sinhala dubbed release.
 * Embeds a YouTube source when one of the links is a YouTube URL,
 * otherwise hands off to Telegram / external mirrors.
 */
export default function PlayerCard({ release }: { release: ReleaseDetail }) {
  const embedSource = release.qualities.find((quality) => parseYoutubeId(quality.url));
  const videoId = embedSource ? parseYoutubeId(embedSource.url) : null;
  const [copied, setCopied] = useState(false);
  const total = totalSize(release.qualities);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="panel scanlines relative overflow-hidden p-2">
        <div className="relative aspect-video overflow-hidden rounded-[0.9rem] bg-void-950">
          {videoId ? (
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&color=white&autoplay=0`}
              title={`${release.title} — සිංහල හඬකැවීම`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              {release.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={release.thumbnail}
                  alt={release.title}
                  className="h-full w-full object-cover opacity-70"
                />
              ) : (
                <div className="hex-grid h-full w-full" />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-void-950/70 px-6 text-center">
                <span className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-omni-300 bg-void-950/80">
                  <span className="absolute inset-0 rounded-full border border-omni-400/60 animate-pulse-ring" />
                  <svg viewBox="0 0 24 24" className="ml-1 h-9 w-9 fill-omni-300">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <p className="max-w-sm text-sm leading-relaxed text-void-100">
                  වීඩියෝව ධාරාව සඳහා පහත සබැඳිය භාවිතා කරන්න. සියලුම ගොනු ටෙලිග්‍රෑම් හරහා සිංහල හඬකැවීමෙන් ලබා ගත හැක.
                </p>
                <a
                  href={release.telegram_url || "#"}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-full bg-linear-to-r from-omni-300 to-omni-600 px-6 py-3 font-display text-xs font-black tracking-wider text-void-950 uppercase"
                >
                  ටෙලිග්‍රෑම් හරහා නරඹන්න
                </a>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
          <div className="flex flex-wrap items-center gap-2 text-[0.65rem] font-black tracking-wider uppercase">
            <span className="rounded-full bg-omni-400/90 px-3 py-1 text-void-950">
              සිංහල හඬකැවීම
            </span>
            <span className="rounded-full border border-omni-400/35 px-3 py-1 text-omni-300">
              {release.quality}
            </span>
            <span className="rounded-full border border-void-500 px-3 py-1 text-void-100">
              {release.quality === "480p" ? "SD" : "HD"} · {release.duration_minutes} මිනිත්තු
            </span>
          </div>

          <button
            type="button"
            onClick={copyLink}
            className="flex items-center gap-2 rounded-full border border-void-500 px-4 py-2 text-xs font-bold text-void-100 transition-colors hover:border-omni-400/60 hover:text-omni-300"
          >
            {copied ? "පිටපත් විය ✓" : "සබැඳිය පිටපත් කරන්න"}
          </button>
        </div>
      </div>

      {/* download list */}
      <div className="panel p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-sm font-black tracking-[0.22em] text-omni-300 uppercase">
            බාගැනීමේ සබැඳි
          </h2>
          {total > 0 ? (
            <span className="text-xs font-bold text-void-200">එකතුව ≈ {formatSize(total)}</span>
          ) : null}
        </div>

        {release.qualities.length === 0 ? (
          <p className="text-sm text-void-100">
            මෙම නිකුතුව සඳහා සබැඳි තවම එක් කර නැත. ටෙලිග්‍රෑම් නාලිකාවෙන් ඉල්ලන්න.
          </p>
        ) : (
          <ul className="space-y-3">
            {release.qualities.map((quality) => (
              <li key={quality.id}>
                <a
                  href={quality.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-void-600 bg-void-950/60 px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-omni-400/60 hover:bg-omni-400/5"
                >
                  <span className="flex items-center gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-omni-400/40 bg-omni-400/10 font-display text-[0.68rem] font-black text-omni-300">
                      {quality.label.replace(/[^0-9a-zA-Z]/g, "").slice(0, 4) || "LINK"}
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-white">
                        {quality.label} — බාගන්න
                      </span>
                      <span className="block text-[0.7rem] text-void-200">
                        {formatSize(quality.file_size_mb)} · සිංහල හඬකැවීම
                      </span>
                    </span>
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 text-omni-300 transition-transform group-hover:translate-y-0.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <path d="M12 4v12m0 0 5-5m-5 5-5-5M5 20h14" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          {release.telegram_url ? (
            <a
              href={release.telegram_url}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-2 rounded-full bg-linear-to-r from-omni-400 to-omni-600 px-5 py-2.5 text-xs font-black tracking-wider text-void-950 uppercase"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M21.9 4.3 19 19.1c-.2 1-.8 1.2-1.6.8l-4.5-3.3-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.5 8.3-7.5c.4-.3-.1-.5-.6-.2L7.5 12.4l-4.4-1.4c-1-.3-1-1 .2-1.4l17-6.6c.8-.3 1.5.2 1.6 1.3Z" />
              </svg>
              ටෙලිග්‍රෑම්
            </a>
          ) : null}

          <AnimatePresence>
            {copied && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center text-xs font-bold text-omni-300"
              >
                සබැඳිය පිටපත් කරන ලදි
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
