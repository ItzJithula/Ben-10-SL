"use client";

import { useEffect, useState } from "react";

export default function Preloader() {
  const [mounted, setMounted] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Keep preloader visible briefly to allow components and assets to hydrate
    const timer = setTimeout(() => {
      setFading(true);
      const unmountTimer = setTimeout(() => {
        setMounted(false);
      }, 500);
      return () => clearTimeout(unmountTimer);
    }, 750);

    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <style>{`
        .omni-preloader-overlay {
          background: #425632;
          width: 100%;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 999999;
          animation: bgRotate 2s infinite ease-in-out;
          transition: opacity 0.5s ease-out;
        }

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

        @keyframes bgRotate {
          0% {
            background: #ffffff;
          }
          50% {
            background: #000000;
          }
          100% {
            background: #ffffff;
          }
        }
      `}</style>
      <div
        className={`omni-preloader-overlay ${
          fading ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        aria-label="Loading"
        role="status"
      >
        <div className="omni-preloader-loader" />
      </div>
    </>
  );
}
