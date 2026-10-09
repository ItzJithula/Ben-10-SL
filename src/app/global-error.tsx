"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- a plain <a> forces a full
   page load, which is exactly what this screen needs after a layout crash. */

import { useEffect } from "react";

/**
 * Last line of defence.
 *
 * `error.tsx` cannot catch a failure inside the root layout itself (the layout
 * is the one that loads the settings and categories from the database), so a
 * bad deploy or a missing DATABASE_URL would otherwise show the browser's bare
 * "Application error" screen. This component replaces the whole document and
 * styles itself with inline styles on purpose, so it renders even when the
 * application stylesheet never loads.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Ben 10 SL] fatal error in the root layout", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          background: "#030504",
          color: "#e7ecea",
          fontFamily:
            'Rajdhani, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
          textAlign: "center",
        }}
      >
        <main style={{ maxWidth: "36rem" }}>
          <svg
            viewBox="0 0 128 128"
            width={132}
            height={132}
            role="img"
            aria-label="Ben 10 SL"
            style={{ display: "block", margin: "0 auto" }}
          >
            <rect width="128" height="128" rx="8" fill="#020603" />
            <circle cx="64" cy="64" r="57" fill="#04120a" />
            <circle cx="64" cy="64" r="55" fill="none" stroke="#4dff00" strokeWidth="4.5" opacity="0.75" />
            <circle cx="64" cy="64" r="55" fill="none" stroke="#c6ff7a" strokeWidth="2.6" />
            <path
              d="M62 20 L30 62 L48 62 L38 108 L78 58 L56 58 L76 20 Z"
              fill="#7cf400"
              stroke="#e9ffbe"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path
              d="M92 34 L60 76 L78 76 L68 122 L108 72 L86 72 L106 34 Z"
              fill="#5ed800"
              stroke="#e9ffbe"
              strokeWidth="1.1"
              strokeLinejoin="round"
              opacity="0.94"
            />
          </svg>

          <p
            style={{
              margin: "2rem 0 0",
              fontFamily: 'Orbitron, ui-sans-serif, system-ui, sans-serif',
              fontSize: "0.7rem",
              fontWeight: 900,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "#ff3b3b",
            }}
          >
            Omnitrix malfunction
          </p>
          <h1
            style={{
              margin: "0.75rem 0 0",
              fontFamily: 'Orbitron, ui-sans-serif, system-ui, sans-serif',
              fontSize: "1.75rem",
              fontWeight: 900,
              color: "#ffffff",
            }}
          >
            The site is offline for a moment
          </h1>
          <p style={{ margin: "1rem 0 0", fontSize: "0.95rem", lineHeight: 1.7, color: "#c3cfcb" }}>
            The server could not build this page at all. Reloading in a few seconds usually
            fixes it. If you keep seeing this screen, the site owner has to check the deploy.
          </p>

          <p
            style={{
              display: "inline-block",
              margin: "1.5rem 0 0",
              padding: "0.5rem 1rem",
              border: "1px solid #3a4a45",
              borderRadius: "999px",
              background: "#0b1110",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "11px",
              color: "#92a39e",
            }}
          >
            Reference code: <span style={{ color: "#aaff7d" }}>{error.digest ?? "unavailable"}</span>
          </p>

          <div style={{ margin: "2rem 0 0", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                cursor: "pointer",
                border: 0,
                borderRadius: "999px",
                padding: "0.8rem 1.6rem",
                background: "linear-gradient(90deg, #39ff14, #17a000)",
                color: "#030504",
                fontFamily: 'Orbitron, ui-sans-serif, system-ui, sans-serif',
                fontSize: "0.75rem",
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                borderRadius: "999px",
                border: "1px solid rgba(57,255,20,0.4)",
                padding: "0.8rem 1.6rem",
                color: "#aaff7d",
                fontFamily: 'Orbitron, ui-sans-serif, system-ui, sans-serif',
                fontSize: "0.75rem",
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              Back to home
            </a>
          </div>

          <p style={{ margin: "2.5rem 0 0", fontSize: "11px", lineHeight: 1.7, color: "#5f736e" }}>
            Site owner: search the server logs for the reference code above. On a fresh
            deploy this is almost always a missing environment variable — check that
            DATABASE_URL, ADMIN_PASSWORD and ADMIN_SESSION_SECRET are set in the hosting
            dashboard, then redeploy.
          </p>
        </main>
      </body>
    </html>
  );
}
