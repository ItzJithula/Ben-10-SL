import Link from "next/link";
import type { CategoryWithCount } from "@/lib/types";
import { RevealGroup, RevealItem } from "./Reveal";

export default function CategoryGrid({ categories }: { categories: CategoryWithCount[] }) {
  return (
    <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <RevealItem key={category.slug}>
          <Link
            href={`/category/${category.slug}`}
            className="panel panel-hover group relative flex h-full flex-col overflow-hidden p-6"
          >
            <span
              className="absolute inset-x-0 top-0 h-1 opacity-80"
              style={{ background: `linear-gradient(90deg, ${category.accent}, transparent)` }}
            />
            <span
              className="pointer-events-none absolute -right-16 -bottom-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
              style={{ background: category.accent }}
            />

            <span
              className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border text-lg font-black"
              style={{
                borderColor: `${category.accent}55`,
                color: category.accent,
                background: `${category.accent}14`,
              }}
            >
              {category.name
                .split(" ")
                .map((word) => word[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>

            <h3 className="font-display text-lg font-black text-white transition-colors group-hover:text-omni-300">
              {category.name_alt || category.name}
            </h3>
            <p className="mt-1 text-[0.7rem] font-bold tracking-[0.22em] text-void-200 uppercase">
              {category.name}
            </p>
            <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-void-100">
              {category.description}
            </p>

            <span className="mt-6 flex items-center justify-between border-t border-void-600/60 pt-4">
              <span className="font-display text-sm font-black" style={{ color: category.accent }}>
                {category.release_count} releases
              </span>
              <span className="flex items-center gap-1 text-xs font-bold tracking-wider text-void-200 uppercase transition-colors group-hover:text-omni-300">
                Browse
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </span>
          </Link>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}
