"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "scale";

const OFFSETS: Record<Direction, { x?: number; y?: number; scale?: number }> = {
  up: { y: 34 },
  down: { y: -34 },
  left: { x: 42 },
  right: { x: -42 },
  scale: { scale: 0.92 },
};

/** Scroll-triggered reveal used across every page section. */
export default function Reveal({
  children,
  delay = 0,
  direction = "up",
  duration = 0.7,
  className,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  direction?: Direction;
  duration?: number;
  className?: string;
  once?: boolean;
}) {
  const reduce = useReducedMotion();
  const offset = OFFSETS[direction];

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once, amount: 0.22, margin: "-60px" }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Staggered container: children animate one after another as they scroll in. */
export function RevealGroup({
  children,
  className,
  stagger = 0.09,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.12 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 28 },
        show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}
