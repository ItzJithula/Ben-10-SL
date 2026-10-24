"use client";

import { useEffect, useState } from "react";

const DNA_PHASES = [
  { at: 0, text: "CALIBRATING OMNITRIX CORE..." },
  { at: 28, text: "SCANNING GALVAN DNA ARCHIVE..." },
  { at: 58, text: "SYNCHRONIZING 10 ALIEN MATRICES..." },
  { at: 85, text: "OMNITRIX CHARGED · HERO TIME!" },
];

export default function Preloader() {
  const [mounted, setMounted] = useState(true);
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(12);
  const [statusText, setStatusText] = useState(DNA_PHASES[0].text);

  useEffect(() => {
    // Check if user already saw the full preloader in this tab session
    const hasSeen = typeof window !== "undefined" && sessionStorage.getItem("b10sl:booted") === "1";
    const duration = hasSeen ? 600 : 1400;

    const startTime = performance.now();

    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const rawPct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(rawPct);

      // Update HUD phase text
      for (let i = DNA_PHASES.length - 1; i >= 0; i--) {
        if (rawPct >= DNA_PHASES[i].at) {
          setStatusText(DNA_PHASES[i].text);
          break;
        }
      }

      if (elapsed >= duration) {
        clearInterval(interval);
        try {
          sessionStorage.setItem("b10sl:booted", "1");
        } catch {
          // Ignore private browsing storage errors
        }

        // Trigger Omnitrix exit flash
        setFading(true);
        setTimeout(() => {
          setMounted(false);
        }, 450);
      }
    }, 28);

    return () => clearInterval(interval);
  }, []);

  const handleSkip = () => {
    setFading(true);
    try {
      sessionStorage.setItem("b10sl:booted", "1");
    } catch {}
    setTimeout(() => {
      setMounted(false);
    }, 250);
  };

  if (!mounted) return null;

  return (
    <>
      <style>{`
        /* Omnitrix Watch Spin Animation */
        .omni-preloader-loader {
          border: 60px solid #000000;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-top: 60px solid transparent;
          border-bottom: 60px solid transparent;
          border-radius: 50%;
          animation: rotateAndSpilt 2s infinite ease-in-out;
        }

        @keyframes rotateAndSpilt {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
            width: 0;
            border-top: 60px solid transparent;
            border-bottom: 60px solid transparent;
            border-left: 60px solid #000000;
            border-right: 60px solid #000000;
          }
          50% {
            transform: translate(-50%, -50%) rotate(180deg);
            width: 0;
            border-top: 60px solid #ffffff;
            border-bottom: 60px solid #ffffff;
            border-left: 60px solid transparent;
            border-right: 60px solid transparent;
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg);
            width: 0;
            border-top: 60px solid transparent;
            border-bottom: 60px solid transparent;
            border-left: 60px solid #000000;
            border-right: 60px solid #000000;
          }
        }

        /* Omnitrix Watch Core background synchronized with the spin animation */
        @keyframes omniCoreBgRotate {
          0% {
            background: #39ff14;
            box-shadow: 0 0 35px rgba(57, 255, 20, 0.9);
          }
          50% {
            background: #000000;
            box-shadow: 0 0 20px rgba(57, 255, 20, 0.35);
          }
          100% {
            background: #39ff14;
            box-shadow: 0 0 35px rgba(57, 255, 20, 0.9);
          }
        }

        .omni-watch-core-bg {
          animation: omniCoreBgRotate 2s infinite ease-in-out;
        }
      `}</style>

      <div
        onClick={handleSkip}
        className={`fixed inset-0 z-999999 flex flex-col items-center justify-center bg-[#030805] select-none transition-all duration-400 ease-out cursor-pointer ${
          fading ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
        }`}
        aria-label="Omnitrix Initializing"
        role="status"
      >
        {/* Sci-Fi Background Hex Grid & Neon Radial Glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(57,255,20,0.18)_0%,rgba(3,8,5,0.92)_65%,#010402_100%)]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(57,255,20,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(57,255,20,0.12) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Omnitrix Presentation with Watch Spin Animation */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Watch Bezel Chamber */}
          <div className="relative flex items-center justify-center">
            {/* Outer Green Shockwave Pulse */}
            <div className="pointer-events-none absolute h-52 w-52 sm:h-60 sm:w-60 rounded-full border border-omni-400/25 animate-ping opacity-40" />
            <div className="pointer-events-none absolute h-60 w-60 sm:h-72 sm:w-72 rounded-full border border-omni-400/10" />

            {/* Omnitrix Outer Chassis & Rotating Tick Ring */}
            <div className="relative h-44 w-44 sm:h-52 sm:w-52 rounded-full border-4 border-[#183d21] bg-[#05140a] shadow-[0_0_45px_rgba(57,255,20,0.55)] flex items-center justify-center">
              {/* Rotating Tech Calibration Ring */}
              <div
                className="pointer-events-none absolute inset-2.5 rounded-full border-2 border-dashed border-omni-400/40 animate-spin"
                style={{ animationDuration: "12s" }}
              />

              {/* Four Classic Corner Watch Lugs */}
              <div className="absolute top-2 left-2 h-2.5 w-2.5 rounded-full bg-omni-400 shadow-[0_0_8px_#39ff14]" />
              <div className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-omni-400 shadow-[0_0_8px_#39ff14]" />
              <div className="absolute bottom-2 left-2 h-2.5 w-2.5 rounded-full bg-omni-400 shadow-[0_0_8px_#39ff14]" />
              <div className="absolute bottom-2 right-2 h-2.5 w-2.5 rounded-full bg-omni-400 shadow-[0_0_8px_#39ff14]" />

              {/* Inner Watch Face Chamber: Hosts the Watch Spin Animation */}
              <div className="relative h-[120px] w-[120px] rounded-full overflow-hidden shadow-inner ring-2 ring-omni-400/60">
                {/* Watch Core Synchronized Background */}
                <div className="omni-watch-core-bg absolute inset-0" />

                {/* The Watch Spin Animation Loader */}
                <div className="omni-preloader-loader" />
              </div>
            </div>
          </div>

          {/* Brand & Sinhala Dub HUD Badge */}
          <div className="mt-8 flex flex-col items-center text-center">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-omni-400 shadow-[0_0_8px_#39ff14] animate-ping" />
              <h2 className="font-display text-lg sm:text-xl font-black tracking-[0.28em] text-white uppercase drop-shadow-[0_0_12px_rgba(57,255,20,0.5)]">
                BEN 10 SL
              </h2>
              <span className="h-1.5 w-1.5 rounded-full bg-omni-400 shadow-[0_0_8px_#39ff14]" />
            </div>

            <p className="mt-1 font-mono text-[0.68rem] tracking-[0.3em] text-omni-300 uppercase">
              100% Sinhala Dub Archive
            </p>
          </div>

          {/* Telemetry Progress & Energy Segment Cells */}
          <div className="mt-6 flex flex-col items-center w-64 sm:w-72">
            {/* Segmented Power Blocks (10 Alien Matrix Cells) */}
            <div className="flex w-full items-center justify-between gap-1.5">
              {Array.from({ length: 10 }).map((_, idx) => {
                const active = progress >= (idx + 1) * 10;
                return (
                  <div
                    key={idx}
                    className={`h-2 flex-1 rounded-xs transition-all duration-150 ${
                      active
                        ? "bg-omni-400 shadow-[0_0_10px_#39ff14]"
                        : "bg-[#0b1a0f] border border-omni-400/20"
                    }`}
                  />
                );
              })}
            </div>

            {/* Readout Status & Numeric Percentage */}
            <div className="mt-3.5 flex w-full items-center justify-between font-mono text-[0.65rem] tracking-wider text-omni-300/90">
              <span className="truncate pr-2 uppercase">{statusText}</span>
              <span className="font-black text-omni-400 drop-shadow-[0_0_6px_#39ff14]">
                {progress}%
              </span>
            </div>
          </div>

          {/* Subtle Skip Hint */}
          <div className="mt-6 text-center">
            <span className="font-mono text-[0.58rem] tracking-[0.25em] text-omni-400/60 uppercase hover:text-omni-300 transition-colors">
              Tap anywhere to launch
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
