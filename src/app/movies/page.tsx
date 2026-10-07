import type { Metadata } from "next";

import Pagination from "@/components/Pagination";
import ReleaseCard from "@/components/ReleaseCard";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import TelegramCta from "@/components/TelegramCta";
import { listReleases } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Movies & Specials",
  description: "Full-length Ben 10 movies and specials with Sinhala audio.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MoviesPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const settings = await getSettings();
  const page = Number.parseInt(first(query.page) ?? "1", 10) || 1;

  const result = await listReleases({ type: "movie", page, perPage: 12, sort: "newest" });

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <Reveal>
        <SectionHeading
          kicker="Feature length"
          title="Movies & Specials"
          subtitle="Full-length films from outside the TV seasons — every one dubbed in Sinhala."
        />
      </Reveal>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {result.items.map((release) => (
          <Reveal key={release.id} direction="scale">
            <ReleaseCard release={release} />
          </Reveal>
        ))}
      </div>

      {result.items.length === 0 ? (
        <div className="panel p-12 text-center">
          <p className="font-display text-lg font-black text-white">No movies added yet</p>
        </div>
      ) : null}

      <Pagination
        page={result.page}
        pages={result.pages}
        makeHref={(target) => `/movies${target > 1 ? `?page=${target}` : ""}`}
      />

      <div className="mt-16">
        <TelegramCta
          telegramUrl={settings.telegram_url}
          requestsUrl={settings.telegram_requests}
          members={settings.telegram_members || "12,400"}
        />
      </div>
    </div>
  );
}
