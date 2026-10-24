"use client";

import React from "react";
import dynamic from "next/dynamic";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  autoplay?: boolean;
  className?: string;
  onReady?: (player: any) => void;
}

const VideoPlayerClient = dynamic(() => import("./VideoPlayerClient"), {
  ssr: false,
  loading: () => (
    <div className="relative aspect-video w-full flex items-center justify-center rounded-xl bg-void-950 border border-omni-400/20">
      <div className="flex flex-col items-center gap-3">
        <span className="relative flex h-8 w-8">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-omni-400 opacity-60" />
          <span className="relative inline-flex h-8 w-8 rounded-full border-2 border-omni-400 border-t-transparent animate-spin" />
        </span>
        <span className="font-display text-[0.68rem] font-black tracking-widest text-omni-300 uppercase">
          Initializing Video Player…
        </span>
      </div>
    </div>
  ),
});

/**
 * Modern Video.js React Player component powered by @videojs/react
 * Supports direct links (MP4, M3U8 HLS, WebM) with scaffold skin and responsive 16:9 ratio.
 */
export default function VideoPlayer(props: VideoPlayerProps) {
  if (!props.src) return null;
  return <VideoPlayerClient {...props} />;
}
