"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { CategoryWithCount } from "@/lib/types";
import { cx } from "@/lib/utils";

const TYPES = [
  { value: "all", label: "සියල්ල" },
  { value: "episode", label: "කථාංග" },
  { value: "movie", label: "චිත්‍රපට" },
  { value: "special", label: "විශේෂ" },
];

const SORTS = [
  { value: "newest", label: "අලුත්ම" },
  { value: "views", label: "ජනප්‍රිය" },
  { value: "episode", label: "කථාංග අනුපිළිවෙල" },
  { value: "title", label: "නම අනුව" },
];

export default function FilterBar({
  categories,
  basePath = "/releases",
}: {
  categories: CategoryWithCount[];
  basePath?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(params.get("q") ?? "");

  const category = params.get("category") ?? "all";
  const type = params.get("type") ?? "all";
  const sort = params.get("sort") ?? "newest";

  useEffect(() => {
    setQuery(params.get("q") ?? "");
  }, [params]);

  const push = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (!value || value === "all" || (key === "sort" && value === "newest")) next.delete(key);
      else next.set(key, value);
    }
    next.delete("page");
    startTransition(() => {
      router.push(`${basePath}${next.toString() ? `?${next.toString()}` : ""}`, {
        scroll: false,
      });
    });
  };

  return (
    <div className={cx("panel space-y-5 p-5 sm:p-6", pending && "opacity-70")}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          push({ q: query });
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-omni-400/70">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="කථාංගයේ නම, කේතය හෝ ටැගය සොයන්න…"
            className="w-full rounded-full border border-void-500 bg-void-900/80 py-3 pr-4 pl-11 text-sm text-white outline-none transition-colors placeholder:text-void-300 focus:border-omni-400/70"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-linear-to-r from-omni-400 to-omni-600 px-6 py-3 font-display text-xs font-black tracking-wider text-void-950 uppercase transition-transform hover:scale-[1.02]"
        >
          සොයන්න
        </button>
      </form>

      {/* collections */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => push({ category: "all" })}
          className={cx(
            "rounded-full border px-4 py-2 text-xs font-bold tracking-wide transition-all",
            category === "all"
              ? "border-omni-400 bg-omni-400/15 text-omni-200"
              : "border-void-500 text-void-100 hover:border-omni-400/60 hover:text-omni-300",
          )}
        >
          සියලු මාලාවන්
        </button>
        {categories.map((item) => (
          <button
            key={item.slug}
            type="button"
            onClick={() => push({ category: item.slug })}
            className={cx(
              "rounded-full border px-4 py-2 text-xs font-bold tracking-wide transition-all",
              category === item.slug
                ? "text-void-950"
                : "text-void-100 hover:text-white",
            )}
            style={
              category === item.slug
                ? { borderColor: item.accent, background: item.accent }
                : { borderColor: `${item.accent}44` }
            }
          >
            {item.name_si || item.name}
            <span className="ml-2 opacity-70">{item.release_count}</span>
          </button>
        ))}
      </div>

      {/* type + sort */}
      <div className="flex flex-wrap items-center gap-3 border-t border-void-600/60 pt-4">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => push({ type: item.value })}
              className={cx(
                "rounded-full px-3.5 py-1.5 text-[0.72rem] font-bold tracking-wide transition-colors",
                type === item.value
                  ? "bg-omni-400/20 text-omni-200 ring-1 ring-omni-400/50"
                  : "text-void-200 hover:text-omni-300",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="sort" className="text-[0.68rem] font-bold tracking-wider text-void-200 uppercase">
            පෙළගැස්ම
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(event) => push({ sort: event.target.value })}
            className="rounded-full border border-void-500 bg-void-900 px-4 py-2 text-xs font-bold text-white outline-none focus:border-omni-400/70"
          >
            {SORTS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
