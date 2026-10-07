"use client";

import { useState } from "react";
import { cx } from "@/lib/utils";

/**
 * The signature Ben 10 element — an interactive Omnitrix dial.
 * Pure SVG + CSS so it stays crisp at any size and costs nothing to render.
 */
export default function OmnitrixWatch({
  size = 320,
  interactive = true,
  className,
  label = "Omnitrix",
}: {
  size?: number;
  interactive?: boolean;
  className?: string;
  label?: string;
}) {
  const [active, setActive] = useState(false);

  return (
    <div
      className={cx("relative select-none", className)}
      style={{ width: size, height: size }}
      onClick={() => interactive && setActive((value) => !value)}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={label}
      onKeyDown={(event) => {
        if (!interactive) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setActive((value) => !value);
        }
      }}
    >
      {/* pulsing rings */}
      <span className="absolute inset-0 rounded-full border border-omni-400/40 animate-pulse-ring" />
      <span
        className="absolute inset-0 rounded-full border border-omni-400/25 animate-pulse-ring"
        style={{ animationDelay: "1.2s" }}
      />

      {/* outer glow */}
      <span className="absolute -inset-6 rounded-full bg-omni-400/12 blur-3xl" />

      <svg viewBox="0 0 200 200" className="relative h-full w-full overflow-visible">
        <defs>
          <radialGradient id="watchBody" cx="50%" cy="38%" r="70%">
            <stop offset="0%" stopColor="#1b2b26" />
            <stop offset="55%" stopColor="#0a1411" />
            <stop offset="100%" stopColor="#040a08" />
          </radialGradient>
          <linearGradient id="watchRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#b6ff5c" />
            <stop offset="45%" stopColor="#39ff14" />
            <stop offset="100%" stopColor="#0f7300" />
          </linearGradient>
          <linearGradient id="glassFace" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b6ff5c" />
            <stop offset="50%" stopColor="#39ff14" />
            <stop offset="100%" stopColor="#17a000" />
          </linearGradient>
          <filter id="watchGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* black body */}
        <circle cx="100" cy="100" r="94" fill="url(#watchBody)" stroke="rgba(57,255,20,0.22)" strokeWidth="2" />

        {/* rotating tick ring */}
        <g className={active ? "origin-center animate-omni-spin" : "origin-center animate-omni-spin-rev"}>
          {Array.from({ length: 48 }).map((_, index) => {
            const angle = (index * 360) / 48;
            const major = index % 4 === 0;
            return (
              <rect
                key={index}
                x="99.1"
                y={major ? 10 : 13}
                width={major ? 1.9 : 1.1}
                height={major ? 9 : 5}
                rx="0.6"
                fill={major ? "#7dff3d" : "#2ba300"}
                opacity={major ? 0.95 : 0.6}
                transform={`rotate(${angle} 100 100)`}
              />
            );
          })}
        </g>

        {/* green shell */}
        <circle cx="100" cy="100" r="78" fill="none" stroke="url(#watchRing)" strokeWidth="7" opacity="0.95" />
        <circle cx="100" cy="100" r="70" fill="none" stroke="#062e03" strokeWidth="3" />

        {/* face plate */}
        <circle cx="100" cy="100" r="64" fill="#04120a" stroke="rgba(57,255,20,0.45)" strokeWidth="1.5" />

        {/* rotating inner green ring */}
        <g className="origin-center animate-omni-spin">
          <circle
            cx="100"
            cy="100"
            r="56"
            fill="none"
            stroke="#39ff14"
            strokeWidth="1.6"
            strokeDasharray="10 16"
            opacity="0.65"
          />
        </g>

        {/* the hourglass */}
        <g
          filter="url(#watchGlow)"
          className={cx("origin-center transition-transform duration-500", active ? "scale-95" : "scale-100")}
          style={{ transformBox: "fill-box" }}
        >
          <path d="M70 62 H130 L106 100 L130 138 H70 L94 100 Z" fill="url(#glassFace)" opacity="0.96" />
          <path
            d="M70 62 H130 L106 100 L130 138 H70 L94 100 Z"
            fill="none"
            stroke="#eaffe0"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </g>

        {/* core glow */}
        <circle
          cx="100"
          cy="100"
          r={active ? 12 : 8}
          fill="#eaffe0"
          opacity={active ? 0.85 : 0.4}
          className="transition-all duration-500"
        />
      </svg>

      {/* transformation flash */}
      {active && (
        <>
          <span className="pointer-events-none absolute inset-0 rounded-full bg-omni-400/25 animate-pulse-ring" />
          <span className="pointer-events-none absolute -inset-2 rounded-full border-2 border-omni-200/70 animate-pulse-ring" />
        </>
      )}
    </div>
  );
}

/** Small inline hourglass — used in headers, badges and buttons. */
export function OmnitrixMark({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="3" opacity="0.75" />
      <path d="M19 14 H45 L35 32 L45 50 H19 L29 32 Z" fill="currentColor" opacity="0.95" />
    </svg>
  );
}

/** The classic four-corner "watch shell" frame used to wrap media. */
export function WatchFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cx("relative rounded-[1.4rem] p-[2px]", className)}>
      <div className="absolute inset-0 rounded-[1.4rem] bg-linear-to-br from-omni-300/70 via-omni-700/30 to-transparent" />
      <div className="relative rounded-[1.3rem] bg-void-900/95 overflow-hidden">{children}</div>
      <span className="absolute -left-1 -top-1 h-5 w-5 rounded-full border-2 border-omni-400 bg-void-950" />
      <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full border-2 border-omni-400 bg-void-950" />
      <span className="absolute -bottom-1 -left-1 h-5 w-5 rounded-full border-2 border-omni-400 bg-void-950" />
      <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-omni-400 bg-void-950" />
    </div>
  );
}
