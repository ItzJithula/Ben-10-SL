"use client";

import React, { useState } from "react";
import "@videojs/react/video/scaffold-skin.css";
import { VideoPlayer as VJSPlayer, ScaffoldVideoSkin, Video } from "@videojs/react/video";

interface VideoPlayerClientProps {
  src: string;
  poster?: string;
  title?: string;
  autoplay?: boolean;
  className?: string;
}

export default function VideoPlayerClient({
  src,
  poster,
  title,
  autoplay = false,
  className = "",
}: VideoPlayerClientProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={`relative aspect-video w-full flex flex-col items-center justify-center rounded-xl bg-void-950 p-6 text-center border border-alien-red/30 ${className}`}>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-alien-red/20 text-alien-red mb-3">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </span>
        <p className="font-display text-sm font-bold text-white">Video stream unreachable</p>
        <p className="mt-1 text-xs text-void-200 max-w-sm">
          The direct video link could not be loaded. You can watch or download via the mirror links below.
        </p>
        <a
          href={src}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-4 rounded-full border border-omni-400/50 bg-omni-400/10 px-4 py-2 text-xs font-bold text-omni-300 hover:bg-omni-400/20"
        >
          Open direct link
        </a>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl bg-void-950 shadow-omni border border-omni-400/20 ${className}`}
    >
      <VJSPlayer>
        <ScaffoldVideoSkin style={{ width: "100%", aspectRatio: "16 / 9" }}>
          <Video
            src={src}
            poster={poster}
            title={title}
            autoPlay={autoplay}
            playsInline
            controls
            onError={() => setHasError(true)}
          />
        </ScaffoldVideoSkin>
      </VJSPlayer>
    </div>
  );
}
