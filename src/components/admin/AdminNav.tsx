"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

import Logo from "@/components/Logo";
import { signOutAction } from "@/lib/actions";
import { cx } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard", hint: "Overview", icon: "grid" },
  { href: "/admin/releases", label: "Releases", hint: "Manage", icon: "list" },
  { href: "/admin/releases/new", label: "New release", hint: "Publish", icon: "plus" },
  { href: "/admin/categories", label: "Collections", hint: "Series", icon: "layers" },
  { href: "/admin/settings", label: "Site settings", hint: "Branding", icon: "cog" },
];

function Icon({ name }: { name: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const };
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" {...common}>
      {name === "grid" && (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </>
      )}
      {name === "list" && (
        <>
          <path d="M8 6h13M8 12h13M8 18h13" />
          <circle cx="3.5" cy="6" r="1.2" />
          <circle cx="3.5" cy="12" r="1.2" />
          <circle cx="3.5" cy="18" r="1.2" />
        </>
      )}
      {name === "plus" && <path d="M12 5v14M5 12h14" />}
      {name === "layers" && (
        <>
          <path d="m12 3 9 5-9 5-9-5 9-5Z" />
          <path d="m3 13 9 5 9-5" />
        </>
      )}
      {name === "cog" && (
        <>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 3v2.2M12 18.8V21M4.2 7.5l1.9 1.1M17.9 15.4l1.9 1.1M4.2 16.5l1.9-1.1M17.9 8.6l1.9-1.1" />
        </>
      )}
    </svg>
  );
}

export default function AdminNav({ logoUrl }: { logoUrl: string }) {
  const pathname = usePathname();

  return (
    <aside className="lg:sticky lg:top-24 lg:h-fit">
      <div className="panel p-5">
        <Logo src={logoUrl} width={38} tagline="Admin panel" />

        <nav className="mt-6 space-y-1.5">
          {LINKS.map((link) => {
            const active =
              link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cx(
                  "relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors",
                  active ? "text-omni-200" : "text-void-100 hover:bg-omni-400/8 hover:text-omni-300",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="admin-nav-active"
                    className="absolute inset-0 -z-10 rounded-xl border border-omni-400/45 bg-omni-400/12"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon name={link.icon} />
                <span className="flex flex-col leading-tight">
                  {link.label}
                  <span className="text-[0.6rem] font-black tracking-[0.18em] text-void-300 uppercase">
                    {link.hint}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 space-y-2 border-t border-void-600/70 pt-5">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border border-void-600 px-3.5 py-2.5 text-xs font-bold text-void-100 transition-colors hover:border-omni-400/50 hover:text-omni-300"
          >
            ↗ View live site
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full rounded-xl border border-alien-red/35 px-3.5 py-2.5 text-xs font-bold text-alien-red transition-colors hover:bg-alien-red/10"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
