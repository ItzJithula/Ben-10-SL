import type { Metadata } from "next";

import Pagination from "@/components/Pagination";
import ReleaseCard from "@/components/ReleaseCard";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import TelegramCta from "@/components/TelegramCta";
import { listReleases } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "චිත්‍රපට හා විශේෂ නිකුතු",
  description: "Ben 10 සම්පූර්ණ දිග සිංහල හඬකැවූ චිත්‍රපට හා විශේෂ නිකුතු.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MoviesPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const settings = getSettings();
  const page = Number.parseInt(first(query.page) ?? "1", 10) || 1;

  const result = listReleases({ type: "movie", page, perPage: 12, sort: "newest" });

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <Reveal>
        <SectionHeading
          kicker="මහා තිරය"
          title="චිත්‍රපට හා විශේෂ නිකුතු"
          subtitle="ටෙලි කථාංග මාලාවෙන් පිටත පැමිණි සම්පූර්ණ දිග චිත්‍රපට — සියල්ල සිංහල හඬකැවීමෙන්."
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
          <p className="font-display text-lg font-black text-white">චිත්‍රපට තවම එක් කර නැත</p>
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
