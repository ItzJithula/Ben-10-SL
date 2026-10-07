"use client";

import { useEffect, useRef } from "react";
import { registerViewAction } from "@/lib/actions";

/**
 * Counts a view once per browser session for a release.
 * Runs as a server action so the counter stays server-side.
 */
export default function ViewPing({ releaseId }: { releaseId: number }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    const key = `b10sl-view-${releaseId}`;
    if (sessionStorage.getItem(key)) return;
    fired.current = true;
    sessionStorage.setItem(key, "1");
    void registerViewAction(releaseId).catch(() => undefined);
  }, [releaseId]);

  return null;
}
