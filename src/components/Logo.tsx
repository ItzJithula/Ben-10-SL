"use client";

import Link from "next/link";
import { useState } from "react";

import { cx } from "@/lib/utils";

/**
 * Site logo.
 *
 * The image comes from admin settings (`logo_url`) — either a hosted URL or a
 * file uploaded to /uploads. If the remote image can't be loaded we silently
 * fall back to the built-in mark so the header never shows a broken image.
 */
export default function Logo({
  src,
  alt = "Ben 10 SL",
  width = 52,
  href = "/",
  showText = true,
  tagline,
  className,
}: {
  src?: string;
  alt?: string;
  width?: number;
  href?: string | null;
  showText?: boolean;
  tagline?: string;
  className?: string;
}) {
  const [source, setSource] = useState(src || "/logo.svg");
  const [failed, setFailed] = useState(false);

  const content = (
    <span className={cx("group flex items-center gap-3", className)}>
      <span
        className="relative shrink-0 rounded-full ring-1 ring-omni-400/50 shadow-[0_0_22px_-4px_rgba(57,255,20,0.85)] transition-transform duration-500 group-hover:scale-105"
        style={{ width, height: width }}
      >
        {failed ? (
          <span className="flex h-full w-full items-center justify-center rounded-full bg-void-950 text-omni-400">
            <svg viewBox="0 0 64 64" className="h-3/5 w-3/5" fill="none">
              <path d="M18 12 H46 L35 32 L46 52 H18 L29 32 Z" fill="currentColor" />
            </svg>
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={source}
            alt={alt}
            width={width}
            height={width}
            onError={() => {
              if (source !== "/logo.svg") setSource("/logo.svg");
              else setFailed(true);
            }}
            className="h-full w-full rounded-full object-cover"
          />
        )}
        <span className="pointer-events-none absolute inset-0 rounded-full border border-omni-300/40 animate-pulse-ring" />
      </span>

      {showText && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-lg font-black tracking-[0.14em] text-omni-300 uppercase text-glow">
            Ben 10 <span className="text-white">SL</span>
          </span>
          {tagline ? (
            <span className="mt-1 text-[0.7rem] font-semibold tracking-[0.28em] text-void-200 uppercase">
              {tagline}
            </span>
          ) : null}
        </span>
      )}
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} aria-label={alt}>
      {content}
    </Link>
  );
}
