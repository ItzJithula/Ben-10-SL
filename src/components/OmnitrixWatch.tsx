"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cx } from "@/lib/utils";
import { ALIENS, AlienSilhouette, alienById } from "./aliens";

/**
 * The Omnitrix.
 *
 * How it works (matching the real thing):
 *  1. Drag the dial — or use the arrow keys — to spin the alien wheel.
 *     On release the wheel snaps and the alien sitting at the top marker is
 *     selected.
 *  2. "Click to activate" (the core, or the pill under the watch) slams the
 *     core down: the watch face is replaced by the chosen alien. That alien
 *     stays on the watch.
 *  3. Click the transformed watch again and it restores to the dial — with the
 *     alien you used still on the watch as the live form.
 *
 * The wheel rotation is applied imperatively (a `transform` attribute on the
 * SVG group) so dragging never re-renders React — it stays smooth at 60fps.
 */

const SLOTS = ALIENS.length;
const STEP = 360 / SLOTS; // 36° between two aliens
const VIEW = 400;
const CENTRE = VIEW / 2;
const DIAL_R = 131; // radius the alien badges sit on
const BADGE_R = 23; // badge circle radius
const STORE_KEY = "b10sl:omnitrix";

type Mode = "idle" | "transformed";

export default function OmnitrixWatch({
  size = 360,
  interactive = true,
  className,
  label = "Omnitrix",
}: {
  size?: number;
  interactive?: boolean;
  className?: string;
  label?: string;
}) {
  const [armedIndex, setArmedIndex] = useState<number | null>(null);
  const [liveId, setLiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [flash, setFlash] = useState(false);
  const [dragging, setDragging] = useState(false);

  const dialRef = useRef<SVGGElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const rotRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const drag = useRef<{ pointerId: number; lastAngle: number } | null>(null);
  /**
   * How far the pointer has travelled in the current gesture. Lives outside the
   * drag ref because it must survive `pointerup`: a click event follows it, and
   * a click that was really a drag must not select anything.
   */
  const travelled = useRef(0);
  const flashTimer = useRef<number | null>(null);

  const armedAlien = armedIndex === null ? null : ALIENS[armedIndex];
  const liveAlien = liveId ? (alienById(liveId) ?? null) : null;
  const transformedAlien = mode === "transformed" ? (armedAlien ?? liveAlien ?? ALIENS[0]) : null;

  /* ---------------------------------------------------------------- */
  /* Wheel rotation                                                    */
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

  /** Eases the wheel to `target` degrees (used for snapping). */
  const animateRotation = useCallback(
    (target: number, duration = 460) => {
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

  /** Which alien is under the top marker for a given rotation. */
  const indexForRotation = (deg: number) => {
    if (!Number.isFinite(deg)) return 0;
    return ((Math.round(-deg / STEP) % SLOTS) + SLOTS) % SLOTS;
  };

  /** Rotation that puts alien `index` under the top marker, on the current turn. */
  const rotationForIndex = (index: number) => {
    const base = -index * STEP;
    return base + Math.round((rotRef.current - base) / 360) * 360;
  };

  /* ---------------------------------------------------------------- */
  /* Pointer dragging                                                  */
  /* ---------------------------------------------------------------- */

  const pointerAngle = (clientX: number, clientY: number) => {
    const box = wrapRef.current?.getBoundingClientRect();
    if (!box) return 0;
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;
  };

  const onPointerDown = (event: React.PointerEvent) => {
    if (!interactive || mode === "transformed") return;
    if (event.button !== 0 && event.pointerType === "mouse") return;
    stopAnimation();
    drag.current = {
      pointerId: event.pointerId,
      lastAngle: pointerAngle(event.clientX, event.clientY),
    };
    travelled.current = 0;
    setDragging(true);
  };

  // While a gesture is live the listeners sit on `window`, so the dial keeps
  // following the pointer even when it leaves the watch. Pointer capture is
  // deliberately not used: it would retarget the follow-up click event and tap
  // selection on the badges would stop working.
  useEffect(() => {
    if (!dragging || !interactive) return;

    const move = (event: PointerEvent) => {
      const state = drag.current;
      if (!state || state.pointerId !== event.pointerId) return;
      const angle = pointerAngle(event.clientX, event.clientY);
      let delta = angle - state.lastAngle;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      state.lastAngle = angle;
      travelled.current += Math.abs(delta);
      applyRotation(rotRef.current + delta);
    };

    const up = (event: PointerEvent) => {
      const state = drag.current;
      if (!state || state.pointerId !== event.pointerId) return;
      drag.current = null;
      setDragging(false);
      if (travelled.current > 6) {
        // a real turn: snap the wheel and select whatever is under the marker
        const index = indexForRotation(rotRef.current);
        animateRotation(rotationForIndex(index));
        setArmedIndex(index);
      }
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs are stable; re-binding on every rotation would be wasteful
  }, [dragging, interactive, applyRotation, animateRotation, stopAnimation]);

  /* ---------------------------------------------------------------- */
  /* Selection, transformation, restore                                */
  /* ---------------------------------------------------------------- */

  const selectAlien = (index: number, snap = true) => {
    if (mode === "transformed") return;
    setArmedIndex(index);
    if (snap) animateRotation(rotationForIndex(index));
  };

  const activate = () => {
    if (mode === "transformed") {
      setMode("idle");
      return;
    }
    const index = armedIndex ?? indexForRotation(rotRef.current);
    setArmedIndex(index);
    setLiveId(ALIENS[index].id);
    animateRotation(rotationForIndex(index));
    setFlash(true);
    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(false), 720);
    setMode("transformed");
  };

  /* ---------------------------------------------------------------- */
  /* Lifecycle                                                         */
  /* ---------------------------------------------------------------- */

  // Restore the wheel position + live alien from the last visit.
  useEffect(() => {
    if (!interactive) {
      applyRotation(0);
      return;
    }
    try {
      const saved = window.localStorage.getItem(STORE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { rot?: number; liveId?: string };
        if (typeof parsed.rot === "number" && Number.isFinite(parsed.rot)) applyRotation(parsed.rot);
        if (parsed.liveId && alienById(parsed.liveId)) {
          setLiveId(parsed.liveId);
          setArmedIndex(Math.max(0, ALIENS.findIndex((alien) => alien.id === parsed.liveId)));
        }
      }
    } catch {
      /* private mode / storage disabled — the watch still works */
    }
    return () => {
      stopAnimation();
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    };
  }, [applyRotation, interactive, stopAnimation]);

  // Remember the live alien so the watch keeps it between visits.
  const persist = useCallback(
    (rot: number, id: string | null) => {
      if (!interactive) return;
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify({ rot, liveId: id }));
      } catch {
        /* ignore */
      }
    },
    [interactive],
  );

  /** Arrow keys spin the wheel from anywhere inside the watch. */
  const onDialKeyDown = (event: React.KeyboardEvent) => {
    if (!interactive) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const current = armedIndex ?? indexForRotation(rotRef.current);
      const next = (current + (event.key === "ArrowRight" ? 1 : SLOTS - 1)) % SLOTS;
      selectAlien(next);
    }
    if (event.key === "Escape" && mode === "transformed") setMode("idle");
  };

  // keep the stored state in sync when a transformation finishes
  useEffect(() => {
    if (mode === "idle") persist(rotRef.current, liveId);
  }, [liveId, mode, persist]);

  const accent = transformedAlien?.accent ?? "#39ff14";

  return (
    <div className={cx("flex select-none flex-col items-center gap-5", className)}>
      <div
        ref={wrapRef}
        className={cx(
          "relative",
          interactive && mode === "idle" && "cursor-grab",
          dragging && "cursor-grabbing",
        )}
        style={{ width: size, height: size, touchAction: interactive ? "none" : undefined }}
        onPointerDown={onPointerDown}
        onClick={() => {
          // a tap anywhere on the watch face (not on a badge) activates/restores
          if (!interactive) return;
          if (travelled.current > 6) return; // that gesture was a spin
          activate();
        }}
        onKeyDown={onDialKeyDown}
        role={interactive ? "group" : undefined}
        aria-label={interactive ? `${label} — turn the dial to choose an alien` : label}
      >
        {/* pulsing halo */}
        <span className="pointer-events-none absolute inset-0 rounded-full border border-omni-400/40 animate-pulse-ring" />
        <span
          className="pointer-events-none absolute inset-0 rounded-full border border-omni-400/25 animate-pulse-ring"
          style={{ animationDelay: "1.2s" }}
        />
        <span
          className="pointer-events-none absolute -inset-6 rounded-full blur-3xl transition-colors duration-700"
          style={{ background: `${accent}1f` }}
        />

        {/* transformation flash */}
        {flash ? (
          <span
            className="pointer-events-none absolute inset-0 rounded-full animate-transform-flash"
            style={{
              background: `radial-gradient(circle, ${accent} 0%, rgba(57,255,20,0.35) 45%, transparent 72%)`,
            }}
          />
        ) : null}

        <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="relative h-full w-full overflow-visible">
          <defs>
            <radialGradient id="omniBody" cx="50%" cy="34%" r="72%">
              <stop offset="0%" stopColor="#1b2b26" />
              <stop offset="55%" stopColor="#0a1411" />
              <stop offset="100%" stopColor="#040a08" />
            </radialGradient>
            <radialGradient id="omniFace" cx="50%" cy="42%" r="68%">
              <stop offset="0%" stopColor="#0a1f14" />
              <stop offset="70%" stopColor="#04120a" />
              <stop offset="100%" stopColor="#020806" />
            </radialGradient>
            <linearGradient id="omniShell" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#b6ff5c" />
              <stop offset="45%" stopColor="#39ff14" />
              <stop offset="100%" stopColor="#0f7300" />
            </linearGradient>
            <linearGradient id="omniGlass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b6ff5c" />
              <stop offset="50%" stopColor="#39ff14" />
              <stop offset="100%" stopColor="#17a000" />
            </linearGradient>
            <filter id="omniGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ---------- body ---------- */}
          <circle cx={CENTRE} cy={CENTRE} r={192} fill="url(#omniBody)" stroke="rgba(57,255,20,0.22)" strokeWidth="2" />

          {/* outer tick ring (decorative, keeps turning) */}
          <g className={dragging ? "" : "origin-center animate-omni-spin-rev"} style={{ transformBox: "view-box", transformOrigin: `${CENTRE}px ${CENTRE}px` }}>
            {Array.from({ length: 60 }).map((_, index) => {
              const major = index % 5 === 0;
              return (
                <rect
                  key={index}
                  x={CENTRE - (major ? 1.6 : 1)}
                  y={20}
                  width={major ? 3.2 : 2}
                  height={major ? 15 : 9}
                  rx="1"
                  fill={major ? "#7dff3d" : "#28801b"}
                  opacity={major ? 0.95 : 0.55}
                  transform={`rotate(${(index * 360) / 60} ${CENTRE} ${CENTRE})`}
                />
              );
            })}
          </g>

          {/* green shell */}
          <circle cx={CENTRE} cy={CENTRE} r={158} fill="none" stroke="url(#omniShell)" strokeWidth="11" opacity="0.95" />
          <circle cx={CENTRE} cy={CENTRE} r={146} fill="none" stroke="#062e03" strokeWidth="5" />
          <circle cx={CENTRE} cy={CENTRE} r={140} fill="url(#omniFace)" stroke="rgba(57,255,20,0.4)" strokeWidth="2" />

          {/* top marker — the alien under it is the selected one */}
          <g opacity={mode === "transformed" ? 0 : 1} className="transition-opacity duration-300">
            <path d={`M${CENTRE - 13} 26 L${CENTRE + 13} 26 L${CENTRE} 46 Z`} fill="#39ff14" filter="url(#omniGlow)" />
            <path d={`M${CENTRE - 8} 28 L${CENTRE + 8} 28 L${CENTRE} 41 Z`} fill="#eaffe0" />
          </g>

          {/* ---------- the alien wheel ---------- */}
          <g
            ref={dialRef}
            className="transition-opacity duration-300"
            // while transformed the wheel is invisible — and must not eat clicks,
            // otherwise tapping where a badge was would not restore the watch
            style={{ opacity: mode === "transformed" ? 0 : 1, pointerEvents: mode === "transformed" ? "none" : undefined }}
          >
            {ALIENS.map((alien, index) => {
              const isArmed = armedIndex === index;
              const isLive = liveAlien?.id === alien.id;
              const badgeAccent = isArmed ? "#39ff14" : isLive ? "#aaff7d" : "rgba(57,255,20,0.35)";
              return (
                // two nested groups (rotate, then translate out to the dial radius)
                // rather than one transform list — same result, but every SVG
                // rasteriser in the wild handles it.
                <g key={alien.id} transform={`rotate(${index * STEP} ${CENTRE} ${CENTRE})`}>
                  <g
                    transform={`translate(0 ${-DIAL_R})`}
                    className={interactive ? "cursor-pointer" : undefined}
                    role={interactive ? "button" : undefined}
                    tabIndex={interactive ? 0 : undefined}
                    aria-label={interactive ? `Select ${alien.name}` : undefined}
                    aria-pressed={interactive ? isArmed : undefined}
                    onClick={(event) => {
                      if (!interactive) return;
                      event.stopPropagation();
                      if (travelled.current > 6) return; // that was a drag, not a tap
                      selectAlien(index);
                    }}
                    onKeyDown={(event) => {
                      if (!interactive) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectAlien(index);
                      }
                    }}
                  >
                    {/* badge */}
                    <circle r={BADGE_R} fill="#04120a" stroke={badgeAccent} strokeWidth={isArmed ? 3 : 1.6} />
                    {isArmed ? <circle r={BADGE_R + 4} fill="none" stroke="#39ff14" strokeWidth="1.4" opacity="0.55" /> : null}
                    {isLive && !isArmed ? <circle r={BADGE_R + 4} fill="none" stroke="#aaff7d" strokeWidth="1.2" opacity="0.45" /> : null}

                    {/* alien glyph (drawn on a 64×64 grid, centred in the badge) */}
                    <g transform="translate(-14 -14)">
                      <g transform="scale(0.4375)">
                        <AlienSilhouette alien={alien} accent={isArmed ? "#eaffe0" : isLive ? "#c8ff9b" : "#7dff3d"} />
                      </g>
                    </g>
                  </g>
                </g>
              );
            })}
          </g>

          {/* ---------- core ---------- */}
          <g
            className={interactive ? "cursor-pointer" : undefined}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={
              !interactive
                ? undefined
                : mode === "transformed"
                  ? "Restore the Omnitrix"
                  : `Activate${armedAlien ? ` ${armedAlien.name}` : ""}`
            }
            onClick={(event) => {
              if (!interactive) return;
              event.stopPropagation();
              activate();
            }}
            onKeyDown={(event) => {
              if (!interactive) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                activate();
              }
            }}
          >
            <circle cx={CENTRE} cy={CENTRE} r={74} fill="#020806" stroke="rgba(57,255,20,0.5)" strokeWidth="2" />
            <circle
              cx={CENTRE}
              cy={CENTRE}
              r={68}
              fill="none"
              stroke={transformedAlien ? accent : "#39ff14"}
              strokeWidth="3"
              opacity="0.8"
              filter="url(#omniGlow)"
            />

            {/* idle: the hourglass */}
            <g
              filter="url(#omniGlow)"
              className="transition-opacity duration-300"
              style={{ opacity: transformedAlien ? 0 : 1 }}
            >
              <path d="M170 142 H230 L206 200 L230 258 H170 L194 200 Z" fill="url(#omniGlass)" opacity="0.97" />
              <path
                d="M170 142 H230 L206 200 L230 258 H170 L194 200 Z"
                fill="none"
                stroke="#eaffe0"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <circle cx={CENTRE} cy={CENTRE} r={11} fill="#eaffe0" opacity="0.55" />
            </g>

            {/* transformed: the alien the watch became */}
            {transformedAlien ? (
              <g className="transition-opacity duration-500" style={{ opacity: 1 }}>
                <circle cx={CENTRE} cy={CENTRE} r={64} fill="#03110a" />
                <g transform={`translate(${CENTRE - 46} ${CENTRE - 46}) scale(1.4375)`} filter="url(#omniGlow)">
                  <AlienSilhouette alien={transformedAlien} accent={accent} />
                </g>
              </g>
            ) : null}
          </g>
        </svg>
      </div>

      {/* ---------- status pill ---------- */}
      {interactive ? (
        <div className="flex min-h-[74px] flex-col items-center gap-2 text-center">
          {transformedAlien ? (
            <>
              <p className="font-display text-sm font-black tracking-[0.3em] text-omni-200 uppercase">
                {transformedAlien.name}
              </p>
              <p className="text-[0.68rem] font-bold tracking-[0.22em] text-void-200 uppercase">
                {transformedAlien.species}
              </p>
              <button
                type="button"
                onClick={() => setMode("idle")}
                className="mt-1 rounded-full border border-omni-400/60 bg-omni-400/10 px-5 py-2 font-display text-[0.68rem] font-black tracking-[0.2em] text-omni-200 uppercase transition-colors hover:bg-omni-400/20"
              >
                Click to restore the watch
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={activate}
                className="rounded-full border border-omni-400/60 bg-omni-400/10 px-5 py-2 font-display text-[0.68rem] font-black tracking-[0.2em] text-omni-200 uppercase transition-colors hover:bg-omni-400/20"
              >
                Click to activate
              </button>
              <p className="text-[0.68rem] font-bold tracking-[0.2em] text-void-200 uppercase">
                {armedAlien ? (
                  <>
                    {armedAlien.name} · {armedAlien.species}
                  </>
                ) : (
                  "Drag the dial to choose an alien"
                )}
              </p>
              {armedAlien ? (
                <p className="max-w-[18rem] text-xs leading-relaxed text-void-100">{armedAlien.powers}</p>
              ) : null}
            </>
          )}
          {liveAlien && !transformedAlien && armedAlien?.id !== liveAlien.id ? (
            <p className="text-[0.62rem] font-bold tracking-[0.2em] text-omni-300/80 uppercase">
              On the watch: {liveAlien.name}
            </p>
          ) : null}
        </div>
      ) : null}
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
