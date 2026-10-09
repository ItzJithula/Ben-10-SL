"use client";

import Link from "next/link";
import { useEffect } from "react";

import OmnitrixWatch from "@/components/OmnitrixWatch";

/**
 * Route level error boundary.
 *
 * Rendering, data fetching or a server component that throws lands here with a
 * normal Ben 10 styled page instead of the browser's bare "Application error"
 * screen. `error.digest` is the reference that matches this failure with the
 * full stack trace in the hosting logs.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Ben 10 SL] page failed to render", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
      <OmnitrixWatch size={200} interactive={false} />

      <p className="mt-10 font-display text-[11px] font-black tracking-[0.35em] text-alien-red uppercase">
        Omnitrix malfunction
      </p>
      <h1 className="mt-3 font-display text-3xl font-black text-white sm:text-4xl">
        This page could not be loaded
      </h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-void-100">
        Something went wrong on the server while this page was being built. Try again in a
        moment — the rest of the archive is usually still online.
      </p>

      {error.digest ? (
        <p className="mt-6 rounded-full border border-void-400/60 bg-void-800/60 px-4 py-2 font-mono text-[11px] text-void-200">
          Reference code: <span className="text-omni-200">{error.digest}</span>
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-linear-to-r from-omni-400 to-omni-600 px-6 py-3 font-display text-xs font-black tracking-wider text-void-950 uppercase transition-transform hover:scale-105"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-omni-400/40 px-6 py-3 font-display text-xs font-black tracking-wider text-omni-200 uppercase transition-colors hover:bg-omni-400/10"
        >
          Back to home
        </Link>
        <Link
          href="/releases"
          className="rounded-full border border-void-400/60 px-6 py-3 font-display text-xs font-black tracking-wider text-void-100 uppercase transition-colors hover:bg-void-400/10"
        >
          Browse releases
        </Link>
      </div>

      <p className="mt-10 max-w-md text-[11px] leading-relaxed text-void-300">
        Site owner: search the server logs for the reference code above. On a brand new
        deploy this is almost always a missing environment variable — check that
        DATABASE_URL, ADMIN_PASSWORD and ADMIN_SESSION_SECRET are set in the hosting
        dashboard and redeploy.
      </p>
    </div>
  );
}
