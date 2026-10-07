"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/**
 * Lenis-powered inertial smooth scrolling for the whole site.
 *
 * - Respects `prefers-reduced-motion`
 * - Routes in-page anchor clicks through Lenis so the glide stays consistent
 * - Resets to the top and recalculates the page height on every route change
 *   (Lenis owns the scroll position, so Next's default reset alone isn't enough)
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
      wheelMultiplier: 1,
    });
    lenisRef.current = lenis;

    let frame = 0;
    function raf(time: number) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    }
    frame = requestAnimationFrame(raf);

    const onClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement)?.closest?.('a[href^="#"]');
      if (!target) return;
      const id = target.getAttribute("href");
      if (!id || id === "#") return;
      const element = document.querySelector(id);
      if (!element) return;
      event.preventDefault();
      lenis.scrollTo(element as HTMLElement, { offset: -96, duration: 1.2 });
    };
    document.addEventListener("click", onClick);

    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    return () => {
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(frame);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // new page → back to the top, then re-measure once the content has painted
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    lenis.scrollTo(0, { immediate: true });
    const timers = [
      window.setTimeout(() => lenis.resize(), 120),
      window.setTimeout(() => lenis.resize(), 600),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [pathname]);

  return <>{children}</>;
}
