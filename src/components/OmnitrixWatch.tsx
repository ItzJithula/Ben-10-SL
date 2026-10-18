"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

import { cx } from "@/lib/utils";
import { ALIENS, AlienSilhouette, alienById, type Alien } from "./aliens";

/**
 * The Omnitrix Watch.
 *
 * Interactivity:
 *  1. Spin the watch dial (by dragging, scrolling, using arrow keys, or using the spin buttons).
 *     The aliens rotate inside the watch face, and the active alien is projected holographically in the central core.
 *  2. Clicking the watch face (or core) triggers a green transformation flash, removes the watch,
 *     and replaces it with the full photo of the selected alien.
 *  3. Clicking anywhere on the transformed photo restores the Omnitrix watch face.
 */

const SLOTS = ALIENS.length;
const STEP = 360 / SLOTS; // 36° per alien slot
const VIEW = 420;
const CENTRE = VIEW / 2;
const DIAL_R = 138; // Radius where alien badges sit inside the watch dial
const BADGE_R = 21;
const STORE_KEY = "b10sl:omnitrix";

export default function OmnitrixWatch({
  size = 340,
  interactive = true,
  className,
  label = "Omnitrix",
}: {
  size?: number;
  interactive?: boolean;
  className?: string;
  label?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransformed, setIsTransformed] = useState(false);
  const [flash, setFlash] = useState(false);
  const [dragging, setDragging] = useState(false);

  const dialRef = useRef<SVGGElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const rotRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef<{ pointerId: number; lastAngle: number } | null>(null);
  const travelledRef = useRef(0);
  const flashTimer = useRef<number | null>(null);

  const activeAlien: Alien = ALIENS[activeIndex] ?? ALIENS[0];

  /* ---------------------------------------------------------------- */
  /* Wheel rotation & animation                                       */
  /* ---------------------------------------------------------------- */

  const applyRotation = useCallback((deg: number) => {
    rotRef.current = deg;
    dialRef.current?.setAttribute("transform", `rotate(${deg} ${CENTRE} ${CENTRE})`);
  }, []);

  const stopAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const animateRotation = useCallback(
    (target: number, duration = 380) => {
      stopAnimation();
      const from = rotRef.current;
      const delta = target - from;
      if (Math.abs(delta) < 0.01) {
        applyRotation(target);
        return;
      }
      const started = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - started) / duration);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        applyRotation(from + delta * eased);
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
        else rafRef.current = null;
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [applyRotation, stopAnimation],
  );

  const indexForRotation = (deg: number) => {
    if (!Number.isFinite(deg)) return 0;
    return ((Math.round(-deg / STEP) % SLOTS) + SLOTS) % SLOTS;
  };

  const rotationForIndex = (index: number) => {
    const base = -index * STEP;
    return base + Math.round((rotRef.current - base) / 360) * 360;
  };

  const selectAlien = (index: number, snap = true) => {
    if (isTransformed) return;
    const normalized = ((index % SLOTS) + SLOTS) % SLOTS;
    setActiveIndex(normalized);
    if (snap) animateRotation(rotationForIndex(normalized));
  };

  const spinRelative = (direction: 1 | -1) => {
    if (!interactive || isTransformed) return;
    const next = (activeIndex + direction + SLOTS) % SLOTS;
    selectAlien(next, true);
  };

  /* ---------------------------------------------------------------- */
  /* Pointer Dragging                                                  */
  /* ---------------------------------------------------------------- */

  const pointerAngle = (clientX: number, clientY: number) => {
    const box = wrapRef.current?.getBoundingClientRect();
    if (!box) return 0;
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;
  };

  const onPointerDown = (event: React.PointerEvent) => {
    if (!interactive || isTransformed) return;
    if (event.button !== 0 && event.pointerType === "mouse") return;
    stopAnimation();
    dragRef.current = {
      pointerId: event.pointerId,
      lastAngle: pointerAngle(event.clientX, event.clientY),
    };
    travelledRef.current = 0;
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging || !interactive) return;

    const onPointerMove = (event: PointerEvent) => {
      const state = dragRef.current;
      if (!state || state.pointerId !== event.pointerId) return;
      const angle = pointerAngle(event.clientX, event.clientY);
      let delta = angle - state.lastAngle;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      state.lastAngle = angle;
      travelledRef.current += Math.abs(delta);
      applyRotation(rotRef.current + delta);
      // update active alien live as dial turns
      const idx = indexForRotation(rotRef.current);
      if (idx !== activeIndex) {
        setActiveIndex(idx);
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      const state = dragRef.current;
      if (!state || state.pointerId !== event.pointerId) return;
      dragRef.current = null;
      setDragging(false);
      if (travelledRef.current > 5) {
        const index = indexForRotation(rotRef.current);
        animateRotation(rotationForIndex(index));
        setActiveIndex(index);
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [dragging, interactive, applyRotation, animateRotation, activeIndex]);

  /* ---------------------------------------------------------------- */
  /* Transformation & Restore                                          */
  /* ---------------------------------------------------------------- */

  const triggerTransform = () => {
    if (!interactive) return;
    setFlash(true);
    if (flashTimer.current !== null) clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(false), 700);
    setIsTransformed(true);
  };

  const restoreWatch = () => {
    if (!interactive) return;
    setFlash(true);
    if (flashTimer.current !== null) clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(false), 700);
    setIsTransformed(false);
  };

  const handleWatchClick = () => {
    if (!interactive) return;
    if (travelledRef.current > 6) return; // ignore drags
    triggerTransform();
  };

  /* ---------------------------------------------------------------- */
  /* Keyboard navigation                                               */
  /* ---------------------------------------------------------------- */

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!interactive) return;
    if (isTransformed) {
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        restoreWatch();
      }
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      spinRelative(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      spinRelative(-1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      triggerTransform();
    }
  };

  /* ---------------------------------------------------------------- */
  /* Persistence                                                       */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!interactive) return;
    try {
      const saved = window.localStorage.getItem(STORE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.index === "number" && parsed.index >= 0 && parsed.index < SLOTS) {
          setActiveIndex(parsed.index);
          applyRotation(rotationForIndex(parsed.index));
        }
      }
    } catch {
      // fallback
    }
  }, [interactive, applyRotation]);

  useEffect(() => {
    if (!interactive) return;
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify({ index: activeIndex }));
    } catch {
      // fallback
    }
  }, [activeIndex, interactive]);

  const accent = activeAlien.accent || "#39ff14";

  return (
    <div className={cx("relative flex select-none flex-col items-center gap-4", className)}>
      {/* Transformation burst effect */}
      {flash && (
        <div
          className="pointer-events-none fixed inset-0 z-50 animate-transform-flash"
          style={{
            background: `radial-gradient(circle at center, ${accent}cc 0%, rgba(57,255,20,0.4) 40%, transparent 75%)`,
          }}
        />
      )}

      {/* Main Container - Switches between Watch and Full Photo */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={onKeyDown}
        role={interactive ? "region" : undefined}
        aria-label={label}
      >
        <AnimatePresence mode="wait">
          {!isTransformed ? (
            /* ======================================================= */
            /* 1. REDESIGNED OMNITRIX WATCH FACE                       */
            /* ======================================================= */
            <motion.div
              key="omnitrix-watch"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0, rotate: 15 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              ref={wrapRef}
              className={cx(
                "group relative h-full w-full",
                interactive && "cursor-pointer",
                dragging && "cursor-grabbing",
              )}
              onPointerDown={onPointerDown}
              onClick={handleWatchClick}
            >
              {/* Radial ambient glow */}
              <div
                className="pointer-events-none absolute -inset-6 rounded-full blur-2xl transition-colors duration-700"
                style={{ background: `${accent}25` }}
              />

              {/* Pulsing rings */}
              <span className="pointer-events-none absolute inset-0 rounded-full border border-omni-400/40 animate-pulse-ring" />
              <span
                className="pointer-events-none absolute inset-0 rounded-full border border-omni-400/20 animate-pulse-ring"
                style={{ animationDelay: "1.3s" }}
              />

              {/* High-tech SVG Omnitrix Watch Body */}
              <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="relative h-full w-full overflow-visible">
                <defs>
                  {/* Heavy graphite chassis */}
                  <radialGradient id="omniChassis" cx="50%" cy="32%" r="70%">
                    <stop offset="0%" stopColor="#25352e" />
                    <stop offset="40%" stopColor="#121e1a" />
                    <stop offset="85%" stopColor="#080f0c" />
                    <stop offset="100%" stopColor="#030605" />
                  </radialGradient>

                  {/* Metallic green bezel shell */}
                  <linearGradient id="omniBezel" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#d4ff99" />
                    <stop offset="30%" stopColor="#39ff14" />
                    <stop offset="70%" stopColor="#17a000" />
                    <stop offset="100%" stopColor="#084200" />
                  </linearGradient>

                  {/* Inner alien dial face */}
                  <radialGradient id="dialFace" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#062211" />
                    <stop offset="60%" stopColor="#031209" />
                    <stop offset="90%" stopColor="#020805" />
                    <stop offset="100%" stopColor="#010302" />
                  </radialGradient>

                  {/* Holographic lens glass */}
                  <radialGradient id="holoLens" cx="50%" cy="40%" r="60%">
                    <stop offset="0%" stopColor="rgba(57, 255, 20, 0.45)" />
                    <stop offset="55%" stopColor="rgba(23, 160, 0, 0.22)" />
                    <stop offset="88%" stopColor="rgba(4, 18, 10, 0.85)" />
                    <stop offset="100%" stopColor="rgba(2, 8, 4, 0.98)" />
                  </radialGradient>

                  {/* Glow filter */}
                  <filter id="omniGreenGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* 1. Omnitrix Outer Chassis & Four Classic Bolt Lugs */}
                <circle cx={CENTRE} cy={CENTRE} r={198} fill="url(#omniChassis)" stroke="rgba(57,255,20,0.28)" strokeWidth="3" />

                {/* Corner studs / watch lugs */}
                {[45, 135, 225, 315].map((angle) => {
                  const rad = (angle * Math.PI) / 180;
                  const x = CENTRE + Math.cos(rad) * 186;
                  const y = CENTRE + Math.sin(rad) * 186;
                  return (
                    <g key={angle}>
                      <circle cx={x} cy={y} r={13} fill="#0b1612" stroke="#39ff14" strokeWidth="2.5" />
                      <circle cx={x} cy={y} r={7} fill="#eaffe0" opacity="0.9" />
                    </g>
                  );
                })}

                {/* 2. Outer Bezel Ridge with Grips */}
                <circle cx={CENTRE} cy={CENTRE} r={176} fill="none" stroke="#05140b" strokeWidth="18" />
                <circle cx={CENTRE} cy={CENTRE} r={176} fill="none" stroke="url(#omniBezel)" strokeWidth="6" opacity="0.9" />

                {/* Bezel grip notches around the rim */}
                {Array.from({ length: 24 }).map((_, i) => {
                  const rot = i * 15;
                  return (
                    <rect
                      key={rot}
                      x={CENTRE - 3}
                      y={26}
                      width={6}
                      height={12}
                      rx={2}
                      fill="#030805"
                      stroke="#39ff14"
                      strokeWidth={0.8}
                      transform={`rotate(${rot} ${CENTRE} ${CENTRE})`}
                    />
                  );
                })}

                {/* 3. Inner Dial Housing */}
                <circle cx={CENTRE} cy={CENTRE} r={160} fill="url(#dialFace)" stroke="#172b22" strokeWidth="3" />

                {/* 4. Top Selection Pointer Marker */}
                <polygon
                  points={`${CENTRE - 14},40 ${CENTRE + 14},40 ${CENTRE},60`}
                  fill="#39ff14"
                  filter="url(#omniGreenGlow)"
                />
                <polygon
                  points={`${CENTRE - 8},42 ${CENTRE + 8},42 ${CENTRE},55`}
                  fill="#ffffff"
                />

                {/* 5. Rotating Alien Dial Ring (Spins with user input) */}
                <g ref={dialRef}>
                  {/* Subtle track ring */}
                  <circle cx={CENTRE} cy={CENTRE} r={DIAL_R} fill="none" stroke="rgba(57,255,20,0.18)" strokeWidth="2" strokeDasharray="4 6" />

                  {/* 10 Alien Badges situated along the dial ring */}
                  {ALIENS.map((alien, index) => {
                    const isSelected = activeIndex === index;
                    return (
                      <g key={alien.id} transform={`rotate(${index * STEP} ${CENTRE} ${CENTRE})`}>
                        <g
                          transform={`translate(0, ${-DIAL_R})`}
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (travelledRef.current > 6) return;
                            selectAlien(index);
                          }}
                        >
                          {/* Badge Circle */}
                          <circle
                            r={BADGE_R}
                            fill={isSelected ? "#092415" : "#020a05"}
                            stroke={isSelected ? "#39ff14" : "rgba(57, 255, 20, 0.4)"}
                            strokeWidth={isSelected ? 3 : 1.5}
                          />

                          {/* Selected alien pulse ring */}
                          {isSelected && (
                            <circle
                              r={BADGE_R + 4}
                              fill="none"
                              stroke="#39ff14"
                              strokeWidth="1.5"
                              opacity="0.8"
                              filter="url(#omniGreenGlow)"
                            />
                          )}

                          {/* Alien silhouette icon */}
                          <g transform="translate(-14, -14) scale(0.4375)">
                            <AlienSilhouette
                              alien={alien}
                              accent={isSelected ? "#ffffff" : "#39ff14"}
                            />
                          </g>
                        </g>
                      </g>
                    );
                  })}
                </g>

                {/* 6. Central Holographic Core (Alien Display Inside the Watch) */}
                {/* Outer Core Ring */}
                <circle cx={CENTRE} cy={CENTRE} r={92} fill="#020905" stroke="#1f422e" strokeWidth="4" />
                <circle
                  cx={CENTRE}
                  cy={CENTRE}
                  r={88}
                  fill="url(#holoLens)"
                  stroke={accent}
                  strokeWidth="2.5"
                  filter="url(#omniGreenGlow)"
                  opacity="0.85"
                />

                {/* Holographic Radar / Tech Scan Grid */}
                <circle cx={CENTRE} cy={CENTRE} r={65} fill="none" stroke="rgba(57,255,20,0.3)" strokeWidth="1" strokeDasharray="3 4" />
                <circle cx={CENTRE} cy={CENTRE} r={40} fill="none" stroke="rgba(57,255,20,0.25)" strokeWidth="1" />
                <line x1={CENTRE - 70} y1={CENTRE} x2={CENTRE + 70} y2={CENTRE} stroke="rgba(57,255,20,0.2)" strokeWidth="1" />
                <line x1={CENTRE} y1={CENTRE - 70} x2={CENTRE} y2={CENTRE + 70} stroke="rgba(57,255,20,0.2)" strokeWidth="1" />

                {/* PROJECTED ALIEN INSIDE THE WATCH FACE */}
                <g filter="url(#omniGreenGlow)" className="transition-all duration-300">
                  {/* Central Alien Holographic Silhouette */}
                  <g transform={`translate(${CENTRE - 46}, ${CENTRE - 46}) scale(1.4375)`}>
                    <AlienSilhouette alien={activeAlien} accent="#ffffff" />
                  </g>
                </g>

                {/* Holographic Glass Glare / Arc */}
                <path
                  d={`M ${CENTRE - 60} ${CENTRE - 55} A 82 82 0 0 1 ${CENTRE + 60} ${CENTRE - 55}`}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.45)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Interactive Click Indicator Label inside core */}
                <text
                  x={CENTRE}
                  y={CENTRE + 62}
                  textAnchor="middle"
                  fill="#39ff14"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  letterSpacing="2"
                  opacity="0.85"
                >
                  CLICK TO TRANSFORM
                </text>
              </svg>

              {/* Spin Dial Tooltip Overlay */}
              <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-omni-400/40 bg-void-950/80 px-3 py-1 font-display text-[0.65rem] font-bold tracking-wider text-omni-300 uppercase shadow-omni backdrop-blur-md">
                  ⟲ Spin Dial to Cycle ⟳
                </span>
              </div>
            </motion.div>
          ) : (
            /* ======================================================= */
            /* 2. TRANSFORMED STATE: FULL PHOTO REPLACING THE WATCH     */
            /* ======================================================= */
            <motion.div
              key="alien-photo"
              initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.6, opacity: 0, rotate: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={restoreWatch}
              className="group relative h-full w-full cursor-pointer overflow-hidden rounded-full border-4 shadow-omni-lg"
              style={{
                borderColor: accent,
                boxShadow: `0 0 35px -5px ${accent}, inset 0 0 25px rgba(0,0,0,0.8)`,
              }}
              title="Click anywhere to restore the Omnitrix watch"
            >
              {/* Full Action Photo of the Alien */}
              <Image
                src={activeAlien.image}
                alt={activeAlien.name}
                fill
                priority
                sizes="(max-width: 768px) 300px, 380px"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />

              {/* Cinematic Vignette & Glow Overlays */}
              <div
                className="absolute inset-0 bg-linear-to-t from-void-950/90 via-transparent to-void-950/30"
                style={{ mixBlendMode: "multiply" }}
              />
              <div
                className="absolute inset-0 opacity-40 mix-blend-color-dodge transition-opacity duration-500 group-hover:opacity-75"
                style={{
                  background: `radial-gradient(circle at center, ${accent} 0%, transparent 70%)`,
                }}
              />

              {/* Pulsing energy border */}
              <span
                className="pointer-events-none absolute inset-0 rounded-full border-2 animate-pulse-ring"
                style={{ borderColor: accent }}
              />

              {/* Alien Details Banner overlaying photo */}
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center bg-linear-to-t from-void-950 via-void-950/80 to-transparent p-5 text-center">
                <span
                  className="rounded-full px-2.5 py-0.5 text-[0.62rem] font-black tracking-[0.25em] uppercase"
                  style={{
                    color: accent,
                    background: `${accent}22`,
                    border: `1px solid ${accent}66`,
                  }}
                >
                  {activeAlien.species}
                </span>

                <h3 className="mt-1 font-display text-xl font-black tracking-widest text-white uppercase text-glow sm:text-2xl">
                  {activeAlien.name}
                </h3>

                <p className="mt-1 line-clamp-1 max-w-[85%] text-[0.72rem] font-medium text-void-100">
                  {activeAlien.powers}
                </p>

                {/* Click to restore watch prompt */}
                <div className="mt-2.5 flex items-center gap-1.5 rounded-full border border-omni-400/50 bg-omni-400/15 px-3 py-1 font-display text-[0.65rem] font-black tracking-[0.18em] text-omni-300 uppercase shadow-omni transition-transform duration-300 group-hover:scale-105">
                  <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-current stroke-2">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  Click to Restore Watch
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Bar: Spin Controls & Alien Status */}
      {interactive && (
        <div className="flex flex-col items-center gap-2">
          {!isTransformed ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => spinRelative(-1)}
                className="flex items-center gap-1.5 rounded-full border border-void-600 bg-void-900/80 px-3.5 py-1.5 font-display text-xs font-bold text-void-100 transition-colors hover:border-omni-400 hover:bg-omni-400/10 hover:text-omni-300 active:scale-95"
                title="Spin Previous Alien (Left Arrow)"
              >
                ◀ Spin
              </button>

              <button
                type="button"
                onClick={triggerTransform}
                className="rounded-full bg-linear-to-r from-omni-400 via-omni-500 to-omni-600 px-5 py-2 font-display text-xs font-black tracking-widest text-void-950 uppercase shadow-omni transition-transform hover:scale-105 active:scale-95"
              >
                Activate ({activeAlien.name})
              </button>

              <button
                type="button"
                onClick={() => spinRelative(1)}
                className="flex items-center gap-1.5 rounded-full border border-void-600 bg-void-900/80 px-3.5 py-1.5 font-display text-xs font-bold text-void-100 transition-colors hover:border-omni-400 hover:bg-omni-400/10 hover:text-omni-300 active:scale-95"
                title="Spin Next Alien (Right Arrow)"
              >
                Spin ▶
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={restoreWatch}
              className="rounded-full border border-omni-400/60 bg-omni-400/10 px-6 py-2 font-display text-xs font-black tracking-wider text-omni-300 uppercase transition-colors hover:bg-omni-400/20 active:scale-95"
            >
              ↺ Click Photo to Restore Omnitrix
            </button>
          )}

          {/* Active Alien Power Indicator */}
          <p className="text-[0.7rem] font-bold tracking-[0.2em] text-void-300 uppercase">
            {activeAlien.name} · {activeAlien.species} ({activeIndex + 1}/{SLOTS})
          </p>
        </div>
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
      <div className="relative rounded-[1.4rem] bg-void-900/95 overflow-hidden">{children}</div>
      <span className="absolute -left-1 -top-1 h-5 w-5 rounded-full border-2 border-omni-400 bg-void-950" />
      <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full border-2 border-omni-400 bg-void-950" />
      <span className="absolute -bottom-1 -left-1 h-5 w-5 rounded-full border-2 border-omni-400 bg-void-950" />
      <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-omni-400 bg-void-950" />
    </div>
  );
}
