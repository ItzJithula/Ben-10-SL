import Link from "next/link";
import Logo from "./Logo";
import { OmnitrixMark } from "./OmnitrixWatch";
import type { CategoryWithCount } from "@/lib/types";
import { formatDateLong } from "@/lib/utils";

export default function SiteFooter({
  settings,
  categories,
}: {
  settings: Record<string, string>;
  categories: CategoryWithCount[];
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-omni-400/20 bg-void-950/80">
      <div className="hex-grid green-grid-fade pointer-events-none absolute inset-0 opacity-60" />

      {/* giant faint hourglass */}
      <OmnitrixMark
        size={520}
        className="pointer-events-none absolute -right-24 -bottom-32 text-omni-400/5"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="space-y-5">
            <Logo
              src={settings.logo_url || "/logo.svg"}
              alt={settings.logo_text || "Ben 10 SL"}
              tagline={settings.site_tagline}
              width={56}
            />
            <p className="max-w-sm text-sm leading-relaxed text-void-100">
              {settings.site_description}
            </p>
            <div className="flex items-center gap-3 text-[0.7rem] font-bold tracking-[0.2em] text-omni-300 uppercase">
              <span className="flex items-center gap-2 rounded-full border border-omni-400/30 px-3 py-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-omni-400" />
                100% Sinhala Dub
              </span>
              <span className="rounded-full border border-omni-400/30 px-3 py-1">
                {settings.telegram_members || "12,400"}+ members
              </span>
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-display text-xs font-black tracking-[0.28em] text-omni-300 uppercase">
              Collections
            </h3>
            <ul className="space-y-2.5 text-sm">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="group flex items-center justify-between gap-2 text-void-100 transition-colors hover:text-omni-300"
                  >
                    <span>{category.name_alt || category.name}</span>
                    <span className="text-xs text-void-300 group-hover:text-omni-400">
                      {category.release_count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-display text-xs font-black tracking-[0.28em] text-omni-300 uppercase">
              Pages
            </h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: "/releases", label: "All Releases" },
                { href: "/movies", label: "Movies & Specials" },
                { href: "/how-to-download", label: "Download Guide" },
                { href: "/about", label: "About" },
                { href: "/admin/login", label: "Admin Login" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-void-100 transition-colors hover:text-omni-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-display text-xs font-black tracking-[0.28em] text-omni-300 uppercase">
              Join us
            </h3>
            <p className="text-sm leading-relaxed text-void-100">
              Follow our Telegram channel for announcements about new episodes.
            </p>
            <a
              href={settings.telegram_url || "https://t.me/ben10sl"}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-omni-400 to-omni-600 px-5 py-3 text-sm font-black text-void-950 shadow-omni transition-transform hover:scale-[1.02]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M21.9 4.3 19 19.1c-.2 1-.8 1.2-1.6.8l-4.5-3.3-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.5 8.3-7.5c.4-.3-.1-.5-.6-.2L7.5 12.4l-4.4-1.4c-1-.3-1-1 .2-1.4l17-6.6c.8-.3 1.5.2 1.6 1.3Z" />
              </svg>
              Telegram Channel
            </a>
            {settings.contact_email ? (
              <p className="text-xs text-void-200">
                Contact:{" "}
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="text-omni-300 hover:underline"
                >
                  {settings.contact_email}
                </a>
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-14 border-t border-void-600/60 pt-8">
          <p className="text-xs leading-relaxed text-void-200">{settings.disclaimer}</p>
          <div className="mt-6 flex flex-col items-center justify-between gap-3 text-xs text-void-200 sm:flex-row">
            <p>
              © {year} {settings.site_name || "Ben 10 SL"} · {settings.footer_note}
            </p>
            <p className="flex items-center gap-2">
              <span className="text-omni-400">
                <OmnitrixMark size={14} />
              </span>
              Online since {formatDateLong(settings.site_online_since)}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
