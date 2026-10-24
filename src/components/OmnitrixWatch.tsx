"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

import { cx } from "@/lib/utils";
import { ALIENS, AlienSilhouette, type Alien } from "./aliens";

/**
 * The Omnitrix Watch.
 *
 * Interactivity:
 *  1. Spin the watch dial (by dragging, mouse wheel, or using the spin buttons).
 *     The alien glyph in the central holographic chamber rotates to display the selected alien.
 *  2. Clicking the watch transforms it: the watch is replaced by a full, non-rounded photo of the alien.
 *  3. Clicking anywhere on the alien photo restores the Omnitrix watch face.
 */

const SLOTS = ALIENS.length;
const STEP = 360 / SLOTS; // 36° per alien slot
const VIEW = 420;
const CENTRE = VIEW / 2;
const DIAL_R = 142; // Radius of the rotating dial track
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
  const dragRef = useRef<{
    pointerId: number;
    lastAngle: number;
    startX: number;
    startY: number;
    startTime: number;
  } | null>(null);
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
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(10);
      } catch {
        // ignore
      }
    }
  };

  /* ---------------------------------------------------------------- */
  /* Pointer Dragging & Mobile Touch Handling                          */
  /* ---------------------------------------------------------------- */

  const pointerAngle = (clientX: number, clientY: number) => {
    const box = wrapRef.current?.getBoundingClientRect();
    if (!box) return 0;
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || isTransformed) return;
    if (event.button !== 0 && event.pointerType === "mouse") return;
    try {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      // ignore
    }
    stopAnimation();
    dragRef.current = {
      pointerId: event.pointerId,
      lastAngle: pointerAngle(event.clientX, event.clientY),
      startX: event.clientX,
      startY: event.clientY,
      startTime: performance.now(),
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
      const idx = indexForRotation(rotRef.current);
      if (idx !== activeIndex) {
        setActiveIndex(idx);
        if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
          try {
            navigator.vibrate(8);
          } catch {
            // ignore
          }
        }
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      const state = dragRef.current;
      if (!state || state.pointerId !== event.pointerId) return;
      const { startX, startY, startTime } = state;
      dragRef.current = null;
      setDragging(false);

      const dist = Math.hypot(event.clientX - startX, event.clientY - startY);
      const elapsed = performance.now() - startTime;

      if (travelledRef.current > 7 || dist > 18) {
        // Dial was spun by dragging — snap to nearest alien notch
        const index = indexForRotation(rotRef.current);
        animateRotation(rotationForIndex(index));
        setActiveIndex(index);
      } else if (dist <= 18 && elapsed < 450) {
        // Clean mobile tap detected
        triggerTransform();
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
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
    if (!interactive || isTransformed) return;
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate([15, 30, 25]);
      } catch {
        // ignore
      }
    }
    setFlash(true);
    if (flashTimer.current !== null) clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(false), 700);
    setIsTransformed(true);
  };

  const restoreWatch = () => {
    if (!interactive || !isTransformed) return;
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(12);
      } catch {
        // ignore
      }
    }
    setFlash(true);
    if (flashTimer.current !== null) clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(false), 700);
    setIsTransformed(false);
  };

  const handleWatchClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    if (travelledRef.current > 7) return;
    if (!isTransformed) {
      triggerTransform();
    }
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
    <div
      className={cx("relative flex select-none flex-col items-center gap-4 outline-none focus:outline-none", className)}
      style={{ outline: "none" }}
    >
      {/* Transformation burst effect */}
      {flash && (
        <div
          className="pointer-events-none fixed inset-0 z-50 animate-transform-flash"
          style={{
            background: `radial-gradient(circle at center, ${accent}dd 0%, rgba(57,255,20,0.45) 40%, transparent 75%)`,
          }}
        />
      )}

      {/* Main Container - Switches between Watch and Full Photo */}
      <div
        className="relative flex items-center justify-center outline-none focus:outline-none focus-visible:outline-none border-0 w-full aspect-square touch-none select-none"
        style={{
          maxWidth: size,
          maxHeight: size,
          width: "100%",
          height: "auto",
          aspectRatio: "1 / 1",
          outline: "none",
          touchAction: "none",
        }}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={onKeyDown}
        role={interactive ? "region" : undefined}
        aria-label={label}
      >
        <AnimatePresence mode="wait">
          {!isTransformed ? (
            /* ======================================================= */
            /* 1. REDESIGNED OMNITRIX WATCH FACE (NO SMALL ICONS)      */
            /* ======================================================= */
            <motion.div
              key="omnitrix-watch"
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0, rotate: 12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              ref={wrapRef}
              className={cx(
                "group relative h-full w-full aspect-square touch-none select-none outline-none focus:outline-none focus-visible:outline-none",
                interactive && "cursor-pointer",
                dragging && "cursor-grabbing",
              )}
              style={{ outline: "none", touchAction: "none" }}
              onPointerDown={onPointerDown}
              onClick={handleWatchClick}
            >
              {/* Radial ambient glow */}
              <div
                className="pointer-events-none absolute -inset-6 rounded-full blur-2xl transition-colors duration-700"
                style={{ background: `${accent}25` }}
              />

              {/* High-tech SVG Omnitrix Watch Body */}
              <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="relative h-full w-full overflow-visible outline-none pointer-events-none">
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

                {/* 5. Clean Rotating Dial Track (NO SMALL ICONS - clean tech dial markings only) */}
                <g ref={dialRef}>
                  {/* Subtle track ring */}
                  <circle cx={CENTRE} cy={CENTRE} r={DIAL_R} fill="none" stroke="rgba(57,255,20,0.3)" strokeWidth="2" strokeDasharray="6 8" />

                  {/* 10 clean mechanical dial ticks representing alien positions */}
                  {Array.from({ length: SLOTS }).map((_, index) => {
                    const isSelected = activeIndex === index;
                    return (
                      <g key={index} transform={`rotate(${index * STEP} ${CENTRE} ${CENTRE})`}>
                        <rect
                          x={CENTRE - (isSelected ? 3.5 : 2)}
                          y={CENTRE - DIAL_R - (isSelected ? 10 : 6)}
                          width={isSelected ? 7 : 4}
                          height={isSelected ? 20 : 12}
                          rx={2}
                          fill={isSelected ? "#39ff14" : "#196614"}
                          filter={isSelected ? "url(#omniGreenGlow)" : undefined}
                          opacity={isSelected ? 1 : 0.65}
                        />
                      </g>
                    );
                  })}
                </g>

                {/* 6. Central Holographic Core (Alien Display Inside the Watch Face) */}
                <circle cx={CENTRE} cy={CENTRE} r={104} fill="#020905" stroke="#1f422e" strokeWidth="4" />
                <circle
                  cx={CENTRE}
                  cy={CENTRE}
                  r={100}
                  fill="url(#holoLens)"
                  stroke={accent}
                  strokeWidth="3"
                  filter="url(#omniGreenGlow)"
                  opacity="0.9"
                />

                {/* Holographic Radar / Tech Scan Grid */}
                <circle cx={CENTRE} cy={CENTRE} r={74} fill="none" stroke="rgba(57,255,20,0.3)" strokeWidth="1" strokeDasharray="3 4" />
                <circle cx={CENTRE} cy={CENTRE} r={46} fill="none" stroke="rgba(57,255,20,0.25)" strokeWidth="1" />
                <line x1={CENTRE - 80} y1={CENTRE} x2={CENTRE + 80} y2={CENTRE} stroke="rgba(57,255,20,0.2)" strokeWidth="1" />
                <line x1={CENTRE} y1={CENTRE - 80} x2={CENTRE} y2={CENTRE + 80} stroke="rgba(57,255,20,0.2)" strokeWidth="1" />

                {/* REAL FORM SHADOW SILHOUETTE INSIDE THE WATCH FACE */}
                <g className="transition-all duration-300">
                  <g transform={`translate(${CENTRE - 52}, ${CENTRE - 52}) scale(1.625)`}>
                    <AlienSilhouette alien={activeAlien} accent="#020904" />
                  </g>
                </g>

                {/* Holographic Glass Glare / Arc */}
                <path
                  d={`M ${CENTRE - 70} ${CENTRE - 65} A 95 95 0 0 1 ${CENTRE + 70} ${CENTRE - 65}`}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.45)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </motion.div>
          ) : (
            /* ======================================================= */
            /* 2. TRANSFORMED STATE: FULL BODY ALIEN (NO BOX / NO CARD) */
            /* ======================================================= */
            <motion.div
              key="alien-photo"
              initial={{ scale: 0.85, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={restoreWatch}
              onTouchEnd={(e) => {
                e.preventDefault();
                restoreWatch();
              }}
              className="group relative flex h-full w-full cursor-pointer flex-col items-center justify-center select-none outline-none focus:outline-none touch-manipulation active:scale-[0.98] transition-transform"
              style={{ outline: "none" }}
              title="Tap alien to restore Omnitrix"
            >
              {/* Full standing character - completely uncropped, transparent background */}
              <div className="relative h-[84%] w-full flex items-center justify-center">
                <Image
                  src={activeAlien.image}
                  alt={activeAlien.name}
                  fill
                  priority
                  sizes="(max-width: 768px) 340px, 440px"
                  className="object-contain drop-shadow-[0_12px_28px_rgba(0,0,0,0.85)] transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </div>

              {/* Holographic ground projection disk under the alien's feet */}
              <div
                className="pointer-events-none -mt-3 h-5 w-3/4 rounded-[100%] blur-md opacity-60 transition-opacity duration-300 group-hover:opacity-90"
                style={{
                  background: `radial-gradient(ellipse at center, ${accent} 0%, rgba(57,255,20,0.4) 40%, transparent 75%)`,
                }}
              />

              {/* Clean Alien Details — no dark banner box covering the body */}
              <div className="mt-1 text-center pointer-events-none">
                <h3 className="font-display text-xl font-black tracking-widest text-white uppercase text-glow sm:text-2xl">
                  {activeAlien.name}
                </h3>
                <p
                  className="text-[0.68rem] font-black tracking-[0.22em] uppercase"
                  style={{ color: accent }}
                >
                  {activeAlien.species}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pure Watch Face — Alien indicator & Mobile Touch Controls */}
      {interactive && !isTransformed && (
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="flex items-center gap-3 sm:gap-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                spinRelative(-1);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-omni-400/30 bg-void-900/80 text-omni-400 transition-all hover:border-omni-400 hover:bg-omni-400/20 active:scale-90 touch-manipulation sm:hidden"
              aria-label="Previous alien"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="min-w-[140px] text-center">
              <p className="text-[0.72rem] font-black tracking-[0.22em] text-white uppercase drop-shadow-[0_0_8px_rgba(57,255,20,0.6)]">
                {activeAlien.name}
              </p>
              <p className="text-[0.62rem] font-bold tracking-[0.18em] uppercase" style={{ color: accent }}>
                {activeAlien.species}
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                spinRelative(1);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-omni-400/30 bg-void-900/80 text-omni-400 transition-all hover:border-omni-400 hover:bg-omni-400/20 active:scale-90 touch-manipulation sm:hidden"
              aria-label="Next alien"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <p className="text-[0.6rem] font-bold tracking-wider text-omni-400/80 uppercase">
            Spin Dial · Tap to Transform
          </p>
        </div>
      )}

      {/* Transformed state restore hint */}
      {interactive && isTransformed && (
        <div className="text-center">
          <p className="text-[0.62rem] font-bold tracking-wider text-omni-300/90 uppercase animate-pulse">
            Tap alien to restore Omnitrix
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
