"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";

import Logo from "./Logo";
import { OmnitrixMark } from "./OmnitrixWatch";
import { cx } from "@/lib/utils";
import type { CategoryWithCount } from "@/lib/types";

interface HeaderCategory {
  slug: string;
  name: string;
  name_alt: string;
  accent: string;
  release_count: number;
}

export default function SiteHeader({
  settings,
  categories,
}: {
  settings: Record<string, string>;
  categories: CategoryWithCount[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 26, restDelta: 0.001 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setCollectionsOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const menu: HeaderCategory[] = categories.map((category) => ({
    slug: category.slug,
    name: category.name,
    name_alt: category.name_alt,
    accent: category.accent,
    release_count: category.release_count,
  }));

  const links = [
    { href: "/", label: "Home" },
    { href: "/releases", label: "All Releases" },
    { href: "/movies", label: "Movies" },
    { href: "/about", label: "About" },
    { href: "/how-to-download", label: "Help" },
  ];

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = search.trim();
    router.push(query ? `/releases?q=${encodeURIComponent(query)}` : "/releases");
    setSearchOpen(false);
  };

  return (
    <>
      {/* announcement marquee */}
      {settings.announcement ? (
        <div className="relative z-50 overflow-hidden border-b border-omni-400/20 bg-void-950/90">
          <div className="marquee-track flex w-max gap-16 py-1.5 text-[0.72rem] font-semibold tracking-[0.22em] text-omni-300/90 uppercase">
            {Array.from({ length: 2 }).map((_, index) => (
              <span key={index} className="flex gap-16">
                {Array.from({ length: 3 }).map((__, repeat) => (
                  <span key={repeat} className="whitespace-nowrap">
                    {settings.announcement}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <header
        className={cx(
          "sticky top-0 z-50 w-full transition-all duration-500",
          scrolled
            ? "border-b border-omni-400/20 bg-void-950/85 shadow-[0_10px_40px_-20px_rgba(57,255,20,0.6)] backdrop-blur-xl"
            : "border-b border-transparent bg-linear-to-b from-void-950/90 to-transparent",
        )}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo
            src={settings.logo_url || "/logo.svg"}
            alt={settings.logo_text || settings.site_name || "Ben 10 SL"}
            tagline={settings.site_tagline}
            width={48}
          />

          {/* desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cx(
                    "relative rounded-full px-4 py-2 text-sm font-semibold tracking-wide transition-colors",
                    active ? "text-omni-300" : "text-void-100 hover:text-omni-200",
                  )}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 -z-10 rounded-full border border-omni-400/40 bg-omni-400/10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}

            {/* collections dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setCollectionsOpen(true)}
              onMouseLeave={() => setCollectionsOpen(false)}
            >
              <button
                type="button"
                onClick={() => setCollectionsOpen((value) => !value)}
                className={cx(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold tracking-wide transition-colors",
                  pathname.startsWith("/category")
                    ? "text-omni-300"
                    : "text-void-100 hover:text-omni-200",
                )}
                aria-expanded={collectionsOpen}
              >
                Collections
                <svg viewBox="0 0 12 8" className="h-2 w-3 fill-current">
                  <path d="M0 0 L6 8 L12 0 Z" />
                </svg>
              </button>

              <AnimatePresence>
                {collectionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-1/2 top-full w-72 -translate-x-1/2 pt-3"
                  >
                    <div className="panel overflow-hidden p-2 shadow-omni">
                      {menu.map((item) => (
                        <Link
                          key={item.slug}
                          href={`/category/${item.slug}`}
                          className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-omni-400/10"
                        >
                          <span className="flex items-center gap-3">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ background: item.accent, boxShadow: `0 0 10px ${item.accent}` }}
                            />
                            <span>
                              <span className="block text-sm font-semibold text-white">
                                {item.name_alt || item.name}
                              </span>
                              <span className="block text-[0.7rem] tracking-wider text-void-200 uppercase">
                                {item.name}
                              </span>
                            </span>
                          </span>
                          <span className="text-xs font-bold text-omni-300">{item.release_count}</span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          <div className="flex items-center gap-2">
            {/* search */}
            <div className="hidden sm:block">
              <AnimatePresence initial={false} mode="wait">
                {searchOpen ? (
                  <motion.form
                    key="search-open"
                    onSubmit={submitSearch}
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 240, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="flex items-center gap-2 rounded-full border border-omni-400/40 bg-void-900/80 px-3 py-1.5"
                  >
                    <input
                      autoFocus
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search…"
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-void-300"
                    />
                    <button type="submit" className="text-omni-300" aria-label="Search">
                      <OmnitrixMark size={16} />
                    </button>
                  </motion.form>
                ) : (
                  <button
                    key="search-closed"
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-omni-400/25 text-omni-200 transition-colors hover:border-omni-400/70 hover:text-omni-300"
                    aria-label="Search"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.5-3.5" />
                    </svg>
                  </button>
                )}
              </AnimatePresence>
            </div>

            <a
              href={settings.telegram_url || "https://t.me/ben10sl"}
              target="_blank"
              rel="noreferrer noopener"
              className="hidden items-center gap-2 rounded-full bg-linear-to-r from-omni-400 to-omni-600 px-4 py-2 text-sm font-bold text-void-950 shadow-omni transition-transform hover:scale-[1.03] md:flex"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M21.9 4.3 19 19.1c-.2 1-.8 1.2-1.6.8l-4.5-3.3-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.5 8.3-7.5c.4-.3-.1-.5-.6-.2L7.5 12.4l-4.4-1.4c-1-.3-1-1 .2-1.4l17-6.6c.8-.3 1.5.2 1.6 1.3Z" />
              </svg>
              Telegram
            </a>

            {/* mobile toggle */}
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-omni-400/30 text-omni-300 lg:hidden"
              aria-label="Menu"
              aria-expanded={open}
            >
              <span className="relative block h-4 w-6">
                <span
                  className={cx(
                    "absolute left-0 h-[2px] w-6 bg-current transition-all duration-300",
                    open ? "top-2 rotate-45" : "top-0",
                  )}
                />
                <span
                  className={cx(
                    "absolute left-0 top-2 h-[2px] w-6 bg-current transition-all duration-300",
                    open && "opacity-0",
                  )}
                />
                <span
                  className={cx(
                    "absolute left-0 h-[2px] w-6 bg-current transition-all duration-300",
                    open ? "top-2 -rotate-45" : "top-4",
                  )}
                />
              </span>
            </button>
          </div>
        </div>

        {/* scroll energy bar */}
        <motion.div
          style={{ scaleX: progress }}
          className="h-[3px] origin-left bg-linear-to-r from-omni-600 via-omni-400 to-omni-200"
        />

        {/* mobile drawer */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-omni-400/20 bg-void-950/95 backdrop-blur-xl lg:hidden"
            >
              <div className="space-y-4 px-5 py-6">
                <form onSubmit={submitSearch} className="flex items-center gap-2 rounded-full border border-omni-400/30 bg-void-900/80 px-4 py-2">
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search episodes…"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-void-300"
                  />
                  <button type="submit" className="text-omni-300" aria-label="Search">
                    <OmnitrixMark size={18} />
                  </button>
                </form>

                <div className="grid gap-1">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-xl px-4 py-3 text-base font-semibold text-void-50 transition-colors hover:bg-omni-400/10 hover:text-omni-300"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                <div>
                  <p className="px-4 pb-2 text-[0.68rem] font-bold tracking-[0.28em] text-void-300 uppercase">
                    Collections
                  </p>
                  <div className="grid gap-1">
                    {menu.map((item) => (
                      <Link
                        key={item.slug}
                        href={`/category/${item.slug}`}
                        className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-void-100 transition-colors hover:bg-omni-400/10"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: item.accent, boxShadow: `0 0 8px ${item.accent}` }}
                        />
                        {item.name_alt || item.name}
                        <span className="ml-auto text-xs text-omni-300">{item.release_count}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                <a
                  href={settings.telegram_url || "https://t.me/ben10sl"}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-omni-400 to-omni-600 px-4 py-3 text-sm font-bold text-void-950"
                >
                  Join the Telegram channel
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
