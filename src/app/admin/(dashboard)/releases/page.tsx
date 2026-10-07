import type { Metadata } from "next";
import Link from "next/link";

import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import Pagination from "@/components/Pagination";
import Reveal from "@/components/Reveal";
import {
  deleteReleaseAction,
  toggleFeaturedAction,
  toggleReleaseStatusAction,
} from "@/lib/actions";
import { listCategories, listReleases } from "@/lib/queries";
import { formatDateLong, formatViews } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Manage releases",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminReleasesPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const categories = await listCategories();
  const page = Number.parseInt(first(query.page) ?? "1", 10) || 1;

  const result = await listReleases({
    q: first(query.q),
    category: first(query.category),
    status: first(query.status),
    type: first(query.type),
    sort: first(query.sort) ?? "newest",
    page,
    perPage: 15,
  });

  const makeHref = (target: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      const single = first(value);
      if (single && key !== "page") next.set(key, single);
    }
    if (target > 1) next.set("page", String(target));
    return `/admin/releases${next.toString() ? `?${next.toString()}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="panel flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h1 className="font-display text-xl font-black text-white">Manage releases</h1>
            <p className="mt-1 text-sm text-void-100">
              {result.total} releases · page {result.page}/{result.pages}
            </p>
          </div>
          <Link
            href="/admin/releases/new"
            className="rounded-full bg-linear-to-r from-omni-300 via-omni-400 to-omni-600 px-6 py-3 font-display text-xs font-black tracking-[0.2em] text-void-950 uppercase shadow-omni transition-transform hover:scale-[1.03]"
          >
            + New release
          </Link>
        </div>
      </Reveal>

      {query.saved ? (
        <p className="rounded-xl border border-omni-400/40 bg-omni-400/10 px-4 py-3 text-xs font-bold text-omni-200">
          Release saved successfully.
        </p>
      ) : null}
      {query.deleted ? (
        <p className="rounded-xl border border-alien-amber/40 bg-alien-amber/10 px-4 py-3 text-xs font-bold text-alien-amber">
          Release deleted.
        </p>
      ) : null}

      {/* filters */}
      <Reveal>
        <form className="panel space-y-4 p-5" method="get">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              name="q"
              defaultValue={first(query.q) ?? ""}
              placeholder="Search by title, code or tag…"
              className="w-full rounded-xl border border-void-500 bg-void-950/80 px-4 py-2.5 text-sm text-white outline-none focus:border-omni-400/70"
            />
            <button
              type="submit"
              className="rounded-xl border border-omni-400/40 px-6 py-2.5 text-xs font-black tracking-wider text-omni-300 uppercase transition-colors hover:bg-omni-400/10"
            >
              Apply filters
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <select
              name="category"
              defaultValue={first(query.category) ?? "all"}
              className="rounded-xl border border-void-500 bg-void-950/80 px-4 py-2.5 text-sm text-white outline-none focus:border-omni-400/70"
            >
              <option value="all">All collections</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name_alt || category.name}
                </option>
              ))}
            </select>

            <select
              name="status"
              defaultValue={first(query.status) ?? "all"}
              className="rounded-xl border border-void-500 bg-void-950/80 px-4 py-2.5 text-sm text-white outline-none focus:border-omni-400/70"
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>

            <select
              name="type"
              defaultValue={first(query.type) ?? "all"}
              className="rounded-xl border border-void-500 bg-void-950/80 px-4 py-2.5 text-sm text-white outline-none focus:border-omni-400/70"
            >
              <option value="all">All types</option>
              <option value="episode">Episodes</option>
              <option value="movie">Movies</option>
              <option value="special">Specials</option>
              <option value="short">Shorts</option>
            </select>
          </div>
        </form>
      </Reveal>

      {/* table */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-void-600 bg-void-950/60 text-[0.62rem] font-black tracking-[0.2em] text-void-200 uppercase">
              <tr>
                <th className="px-4 py-3">Release</th>
                <th className="px-4 py-3">Collection</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((release) => (
                <tr
                  key={release.id}
                  className="border-b border-void-700/60 transition-colors last:border-0 hover:bg-omni-400/4"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-11 w-20 shrink-0 overflow-hidden rounded-lg bg-void-800">
                        {release.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={release.thumbnail}
                            alt={release.title}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </span>
                      <span className="min-w-0">
                        <Link
                          href={`/admin/releases/${release.id}`}
                          className="line-clamp-1 font-bold text-white hover:text-omni-300"
                        >
                          {release.title}
                        </Link>
                        <span className="mt-0.5 block text-[0.66rem] text-void-300">
                          {release.code} · {release.quality} · {formatDateLong(release.created_at)}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2.5 py-1 text-[0.62rem] font-black tracking-wider uppercase"
                      style={{
                        color: release.category_accent,
                        background: `${release.category_accent}16`,
                        border: `1px solid ${release.category_accent}44`,
                      }}
                    >
                      {release.category_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-void-100">
                    {release.episode_type === "episode"
                      ? `Season ${release.season} · Episode ${release.episode_number ?? "-"}`
                      : release.episode_type === "movie"
                        ? "Movie"
                        : release.episode_type === "special"
                          ? "Special"
                          : "Short"}
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggleReleaseStatusAction}>
                      <input type="hidden" name="id" value={release.id} />
                      <button
                        type="submit"
                        className={
                          release.status === "published"
                            ? "rounded-full border border-omni-400/45 bg-omni-400/12 px-3 py-1 text-[0.62rem] font-black tracking-wider text-omni-300 uppercase"
                            : "rounded-full border border-alien-amber/45 bg-alien-amber/10 px-3 py-1 text-[0.62rem] font-black tracking-wider text-alien-amber uppercase"
                        }
                      >
                        {release.status === "published" ? "Published" : "Draft"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-void-100">
                    {formatViews(release.views)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <form action={toggleFeaturedAction}>
                        <input type="hidden" name="id" value={release.id} />
                        <button
                          type="submit"
                          title="Toggle featured"
                          className={
                            release.featured === 1
                              ? "rounded-lg border border-omni-400/60 bg-omni-400/15 px-3 py-1.5 text-xs font-bold text-omni-300"
                              : "rounded-lg border border-void-500 px-3 py-1.5 text-xs font-bold text-void-200 hover:text-omni-300"
                          }
                        >
                          ★
                        </button>
                      </form>

                      <Link
                        href={`/admin/releases/${release.id}`}
                        className="rounded-lg border border-void-500 px-3 py-1.5 text-xs font-bold text-void-100 transition-colors hover:border-omni-400/60 hover:text-omni-300"
                      >
                        Edit
                      </Link>

                      <Link
                        href={`/release/${release.slug}`}
                        className="rounded-lg border border-void-500 px-3 py-1.5 text-xs font-bold text-void-100 transition-colors hover:border-omni-400/60 hover:text-omni-300"
                      >
                        View
                      </Link>

                      <form action={deleteReleaseAction}>
                        <input type="hidden" name="id" value={release.id} />
                        <ConfirmSubmit
                          className="border-alien-red/40 text-alien-red hover:bg-alien-red/10"
                          message={`Delete “${release.title}”? This cannot be undone.`}
                        >
                          Delete
                        </ConfirmSubmit>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {result.items.length === 0 ? (
          <p className="p-12 text-center text-sm text-void-200">
            No releases match these filters.
          </p>
        ) : null}
      </div>

      <Pagination page={result.page} pages={result.pages} makeHref={makeHref} />
    </div>
  );
}
