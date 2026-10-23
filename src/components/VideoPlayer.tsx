"use client";

import React, { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

type VideoJsPlayer = any;

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  autoplay?: boolean;
  className?: string;
  onReady?: (player: any) => void;
}

function detectVideoType(url: string): string {
  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".m3u8")) return "application/x-mpegURL";
  if (clean.endsWith(".webm")) return "video/webm";
  if (clean.endsWith(".ogg")) return "video/ogg";
  return "video/mp4";
}

/**
 * Video.js Online Video Player component based on official React guide:
 * https://videojs.org/docs/guides/installation/react
 */
export default function VideoPlayer({
  src,
  poster,
  title,
  autoplay = false,
  className = "",
  onReady,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);

  const videoType = detectVideoType(src);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      // The Video.js player needs to be inside the container element
      const videoElement = document.createElement("video-js");
      videoElement.classList.add(
        "vjs-big-play-centered",
        "vjs-theme-omnitrix",
        "vjs-fluid"
      );
      videoRef.current.appendChild(videoElement);

      const options = {
        autoplay,
        controls: true,
        responsive: true,
        fluid: true,
        poster: poster || undefined,
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        sources: [
          {
            src,
            type: videoType,
          },
        ],
        controlBar: {
          children: [
            "playToggle",
            "volumePanel",
            "currentTimeDisplay",
            "timeDivider",
            "durationDisplay",
            "progressControl",
            "playbackRateMenuButton",
            "fullscreenToggle",
          ],
        },
      };

      const player = (playerRef.current = videojs(videoElement, options, () => {
        onReady && onReady(player);
      }));
    } else if (playerRef.current) {
      const player = playerRef.current;
      player.autoplay(autoplay);
      player.src([{ src, type: videoType }]);
      if (poster) player.poster(poster);
    }
  }, [src, poster, autoplay, videoType, onReady]);

  // Dispose player on unmount
  useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div
      data-vjs-player
      className={`relative w-full overflow-hidden rounded-xl bg-void-950 ${className}`}
    >
      <div ref={videoRef} className="w-full" />
    </div>
  );
}
