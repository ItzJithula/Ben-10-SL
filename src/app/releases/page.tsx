import type { Metadata } from "next";

import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import ReleaseCard from "@/components/ReleaseCard";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import { listCategories, listReleases } from "@/lib/queries";

export const metadata: Metadata = {
  title: "All Releases",
  description: "Every Ben 10 episode and movie with Sinhala audio, all in one place.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function ReleasesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const categories = await listCategories();

  const page = Number.parseInt(first(params.page) ?? "1", 10) || 1;
  const filters = {
    q: first(params.q),
    category: first(params.category),
    type: first(params.type),
    sort: first(params.sort),
    page,
    perPage: 12,
  };

  const result = await listReleases(filters);

  const makeHref = (targetPage: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      const single = first(value);
      if (single && key !== "page") next.set(key, single);
    }
    if (targetPage > 1) next.set("page", String(targetPage));
    return `/releases${next.toString() ? `?${next.toString()}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <Reveal>
        <SectionHeading
          kicker="Release library"
          title="All Sinhala releases"
          subtitle={`${result.total} releases — filter by series, type or title.`}
        />
      </Reveal>

      <Reveal delay={0.05}>
        <FilterBar categories={categories} basePath="/releases" />
      </Reveal>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {result.items.map((release) => (
          <Reveal key={release.id}>
            <ReleaseCard release={release} />
          </Reveal>
        ))}
      </div>

      {result.items.length === 0 ? (
        <div className="panel mt-10 p-12 text-center">
          <p className="font-display text-lg font-black text-white">No matching releases</p>
          <p className="mt-2 text-sm text-void-100">
            Try another collection or a different search term.
          </p>
        </div>
      ) : null}

      <Pagination page={result.page} pages={result.pages} makeHref={makeHref} />
    </div>
  );
}
