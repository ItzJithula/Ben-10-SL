"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import OmnitrixWatch from "./OmnitrixWatch";

export default function HeroSection({
  kicker,
  title,
  subtitle,
  image,
  telegramUrl,
  stats,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  image: string;
  telegramUrl: string;
  stats: { releases: number; episodes: number; movies: number; hours: number };
}) {
  const words = title.split(" ");

  return (
    <section className="relative isolate overflow-hidden">
      {/* background art */}
      <div className="absolute inset-0 -z-10">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover opacity-45" />
        ) : null}
        <div className="absolute inset-0 bg-linear-to-b from-void-950/70 via-void-950/85 to-void-900" />
        <div className="hex-grid absolute inset-0 opacity-40" />
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-omni-400/60 to-transparent" />
      </div>

      {/* floating particles */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {Array.from({ length: 18 }).map((_, index) => (
          <motion.span
            key={index}
            className="absolute h-1 w-1 rounded-full bg-omni-400"
            style={{
              left: `${(index * 37) % 100}%`,
              top: `${(index * 53) % 100}%`,
              boxShadow: "0 0 12px rgba(57,255,20,0.9)",
            }}
            animate={{ y: [0, -36, 0], opacity: [0.15, 0.85, 0.15] }}
            transition={{
              duration: 5 + (index % 5),
              repeat: Infinity,
              delay: index * 0.22,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:pt-24 lg:pb-28">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-5 inline-flex items-center gap-3 rounded-full border border-omni-400/40 bg-omni-400/10 px-4 py-2 text-[0.68rem] font-black tracking-[0.3em] text-omni-300 uppercase"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-omni-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-omni-400" />
            </span>
            {kicker}
          </motion.p>

          <h1 className="font-display text-4xl leading-[1.05] font-black tracking-tight text-white uppercase sm:text-5xl lg:text-6xl">
            {words.map((word, index) => (
              <motion.span
                key={`${word}-${index}`}
                initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, delay: 0.08 * index, ease: [0.22, 1, 0.36, 1] }}
                className="mr-3 inline-block"
              >
                <span
                  className={index % 2 === 0 ? "text-glow text-omni-300" : "text-white"}
                >
                  {word}
                </span>
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-void-100 sm:text-lg"
          >
            {subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/releases"
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-linear-to-r from-omni-300 via-omni-400 to-omni-600 px-7 py-3.5 font-display text-sm font-black tracking-wider text-void-950 uppercase shadow-omni-lg transition-transform hover:scale-[1.03]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M8 5v14l11-7z" />
              </svg>
              නැරඹීම අරඹන්න
              <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>

            <a
              href={telegramUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-3 rounded-full border border-omni-400/40 px-7 py-3.5 font-display text-sm font-black tracking-wider text-omni-200 uppercase transition-colors hover:border-omni-400 hover:bg-omni-400/10"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M21.9 4.3 19 19.1c-.2 1-.8 1.2-1.6.8l-4.5-3.3-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.5 8.3-7.5c.4-.3-.1-.5-.6-.2L7.5 12.4l-4.4-1.4c-1-.3-1-1 .2-1.4l17-6.6c.8-.3 1.5.2 1.6 1.3Z" />
              </svg>
              ටෙලිග්‍රෑම්
            </a>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-12 grid max-w-lg grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4"
          >
            {[
              { label: "නිකුතු", value: stats.releases },
              { label: "කථාංග", value: stats.episodes },
              { label: "චිත්‍රපට", value: stats.movies },
              { label: "පැය", value: stats.hours },
            ].map((item) => (
              <div key={item.label}>
                <dt className="text-[0.62rem] font-black tracking-[0.24em] text-void-200 uppercase">
                  {item.label}
                </dt>
                <dd className="font-display text-2xl font-black text-omni-300">{item.value}+</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* Omnitrix */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -12 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto flex items-center justify-center"
        >
          <div className="absolute inset-0 -z-10 rounded-full bg-omni-400/15 blur-[90px]" />
          <OmnitrixWatch size={330} className="animate-float" />
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-omni-400/40 bg-void-950/85 px-4 py-1.5 text-[0.62rem] font-black tracking-[0.24em] text-omni-300 uppercase backdrop-blur">
            ක්ලික් කරන්න · ක්‍රියාත්මක කරන්න
          </div>
        </motion.div>
      </div>
    </section>
  );
}
