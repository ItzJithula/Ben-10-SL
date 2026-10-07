import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import ReleaseCard from "@/components/ReleaseCard";
import Reveal from "@/components/Reveal";
import { getCategoryBySlug, listCategories, listReleases } from "@/lib/queries";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Collection not found" };
  return {
    title: `${category.name} — Sinhala Dub`,
    description: category.description,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const categories = await listCategories();
  const page = Number.parseInt(first(query.page) ?? "1", 10) || 1;

  const result = await listReleases({
    category: slug,
    type: first(query.type),
    q: first(query.q),
    sort: first(query.sort) ?? "episode",
    page,
    perPage: 12,
  });

  const makeHref = (targetPage: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      const single = first(value);
      if (single && key !== "page") next.set(key, single);
    }
    if (targetPage > 1) next.set("page", String(targetPage));
    return `/category/${slug}${next.toString() ? `?${next.toString()}` : ""}`;
  };

  return (
    <div className="relative">
      {/* collection banner */}
      <section className="relative isolate overflow-hidden border-b border-omni-400/20">
        <div
          className="absolute inset-0 -z-10 opacity-25"
          style={{ background: `radial-gradient(circle at 20% 20%, ${category.accent}, transparent 55%)` }}
        />
        <div className="hex-grid absolute inset-0 -z-10 opacity-40" />

        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <nav className="mb-6 flex items-center gap-2 text-[0.7rem] font-bold tracking-wider text-void-200 uppercase">
            <Link href="/" className="hover:text-omni-300">
              Home
            </Link>
            <span className="text-void-400">/</span>
            <Link href="/releases" className="hover:text-omni-300">
              Releases
            </Link>
            <span className="text-void-400">/</span>
            <span style={{ color: category.accent }}>{category.name}</span>
          </nav>

          <Reveal>
            <p
              className="mb-3 text-[0.66rem] font-black tracking-[0.34em] uppercase"
              style={{ color: category.accent }}
            >
              Ben 10 series · {category.release_count} releases
            </p>
            <h1 className="font-display text-3xl font-black text-white sm:text-5xl">
              {category.name}
            </h1>
            <p className="mt-3 text-sm font-bold tracking-[0.24em] text-void-200 uppercase">
              {category.name}
            </p>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-void-100">
              {category.description}
            </p>
          </Reveal>

          {/* sibling collections */}
          <div className="mt-8 flex flex-wrap gap-2">
            {categories
              .filter((item) => item.slug !== category.slug)
              .map((item) => (
                <Link
                  key={item.slug}
                  href={`/category/${item.slug}`}
                  className="rounded-full border px-4 py-1.5 text-xs font-bold transition-colors hover:text-white"
                  style={{ borderColor: `${item.accent}55`, color: item.accent }}
                >
                  {item.name_alt || item.name}
                </Link>
              ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Reveal>
          <FilterBar categories={categories} basePath={`/category/${slug}`} />
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {result.items.map((release) => (
            <Reveal key={release.id}>
              <ReleaseCard release={release} />
            </Reveal>
          ))}
        </div>

        {result.items.length === 0 ? (
          <div className="panel mt-8 p-12 text-center">
            <p className="font-display text-lg font-black text-white">No releases in this collection yet</p>
            <p className="mt-2 text-sm text-void-100">
              New episodes are added all the time — follow our Telegram channel to catch them.
            </p>
          </div>
        ) : null}

        <Pagination page={result.page} pages={result.pages} makeHref={makeHref} />
      </div>
    </div>
  );
}
