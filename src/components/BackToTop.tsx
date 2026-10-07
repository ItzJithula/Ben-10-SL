"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = () => {
    const lenis = (window as unknown as { __lenis?: { scrollTo: (t: number, o?: object) => void } })
      .__lenis;
    if (lenis) lenis.scrollTo(0, { duration: 1.3 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={toTop}
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          className="group fixed right-5 bottom-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-omni-400/50 bg-void-950/85 text-omni-300 shadow-omni backdrop-blur transition-colors hover:border-omni-400 hover:bg-omni-400/15"
          aria-label="ඉහළට"
        >
          <span className="absolute inset-0 rounded-full border border-omni-400/40 animate-pulse-ring" />
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 transition-transform group-hover:-translate-y-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="M12 19V5M6 11l6-6 6 6" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
