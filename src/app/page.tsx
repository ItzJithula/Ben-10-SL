import Link from "next/link";

import AlienStrip from "@/components/AlienStrip";
import CategoryGrid from "@/components/CategoryGrid";
import FeaturedPlayer from "@/components/FeaturedPlayer";
import HeroSection from "@/components/HeroSection";
import ReleaseCard from "@/components/ReleaseCard";
import ReleaseRail from "@/components/ReleaseRail";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import TelegramCta from "@/components/TelegramCta";
import { WatchFrame } from "@/components/OmnitrixWatch";
import { getFeatured, getLatest, getMovies, getSiteStats, getTrending, listCategories } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export default function HomePage() {
  const settings = getSettings();
  const categories = listCategories();
  const stats = getSiteStats();
  const featured = getFeatured(6);
  const latest = getLatest(8);
  const trending = getTrending(6);
  const movies = getMovies(4);

  const heroRelease = featured[0] ?? latest[0] ?? null;

  return (
    <div className="pb-10">
      <HeroSection
        kicker={settings.hero_kicker}
        title={settings.hero_title}
        subtitle={settings.hero_subtitle}
        image={settings.hero_image}
        telegramUrl={settings.telegram_url}
        stats={{
          releases: stats.releases,
          episodes: stats.episodes,
          movies: stats.movies,
          hours: Math.max(1, Math.round(stats.dubbedMinutes / 60)),
        }}
      />

      {/* ------------------------------------------------ collections */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            kicker="ප්‍රධාන එකතුව"
            title="Ben 10 මාලාවන් එකතුව"
            subtitle="ක්ලැසික් සිට ඕම්නිවර්ස් දක්වා — සෑම මාලාවක්ම සිංහල හඬකැවීම සමඟින්, කථාංග අනුපිළිවෙලට සකසා ඇත."
            href="/releases"
            hrefLabel="සියලු නිකුතු"
          />
        </Reveal>
        <CategoryGrid categories={categories} />
      </section>

      {/* ------------------------------------------------ featured */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            kicker="දැන් නරඹන්න"
            title="විශේෂ නිකුතුව"
            subtitle="සෘජුවම මෙතැනින් සිංහල හඬකැවීම නරඹන්න — සම්පූර්ණ කථාංගය පහතින්."
          />
        </Reveal>
        <FeaturedPlayer release={heroRelease} youtubeUrl={settings.featured_youtube} />
      </section>

      {/* ------------------------------------------------ latest */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            kicker="අලුත්ම"
            title="නවතම නිකුතු"
            subtitle="සෑම සතියකම නව කථාංග සිංහල හඬකැවීමෙන් එක් කෙරේ."
            href="/releases?sort=newest"
          />
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {latest.map((release) => (
            <Reveal key={release.id}>
              <ReleaseCard release={release} />
            </Reveal>
          ))}
        </div>

        {latest.length === 0 ? (
          <p className="panel p-10 text-center text-sm text-void-100">
            තවම නිකුතු එක් කර නැත. පරිපාලක පැනලයෙන් පළමු නිකුතුව එක් කරන්න.
          </p>
        ) : null}
      </section>

      {/* ------------------------------------------------ trending rail */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Reveal>
          <ReleaseRail
            kicker="වැඩිපුරම නරඹන ලද"
            title="ජනප්‍රිය නිකුතු"
            releases={trending}
            href="/releases?sort=views"
            accent="#FFC400"
          />
        </Reveal>
      </section>

      {/* ------------------------------------------------ movies */}
      {movies.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeading
              kicker="මහා තිරය"
              title="චිත්‍රපට හා විශේෂ නිකුතු"
              subtitle="ටෙලි කථාංගවලට පිටින් පැමිණි සම්පූර්ණ දිග චිත්‍රපට — සියල්ල සිංහලෙන්."
              href="/movies"
            />
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {movies.map((movie) => (
              <Reveal key={movie.id} direction="scale">
                <WatchFrame className="h-full">
                  <div className="h-full p-2">
                    <ReleaseCard release={movie} compact />
                  </div>
                </WatchFrame>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------ aliens */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            align="center"
            kicker="ඔම්නිට්‍රික්ස්"
            title="එලියන් බලකාය"
            subtitle="බෙන්ගේ අත් ඔරලෝසුවේ සැඟවී ඇති බලවේග — එක් එක් එලියන්ට තමන්ගේම ශක්තියක් ඇත."
          />
        </Reveal>
        <AlienStrip />
      </section>

      {/* ------------------------------------------------ how it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            align="center"
            kicker="පහසු ක්‍රමය"
            title="තත්පර 30කින් නරඹන්න"
          />
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "මාලාව තෝරන්න",
              text: "ක්ලැසික්, එලියන් ෆෝස්, ඕම්නිවර්ස් වැනි ඔබට කැමති මාලාව තෝරන්න.",
            },
            {
              step: "02",
              title: "කථාංගය තෝරන්න",
              text: "නිකුතු පිටුවෙන් කථාංගය හෝ චිත්‍රපටය විවෘත කර ගුණත්වය තෝරන්න.",
            },
            {
              step: "03",
              title: "නරඹන්න / බාගන්න",
              text: "ටෙලිග්‍රෑම් හෝ සබැඳි මගින් සිංහල හඬකැවීම නොමිලේ නරඹන්න හෝ බාගන්න.",
            },
          ].map((item, index) => (
            <Reveal key={item.step} delay={index * 0.1}>
              <div className="panel panel-hover relative h-full overflow-hidden p-7">
                <span className="font-display absolute -top-4 -right-2 text-7xl font-black text-omni-400/10">
                  {item.step}
                </span>
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-omni-400/40 bg-omni-400/10 font-display text-sm font-black text-omni-300">
                  {item.step}
                </span>
                <h3 className="font-display text-base font-black text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-void-100">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mt-10 flex justify-center">
            <Link
              href="/how-to-download"
              className="rounded-full border border-omni-400/40 px-6 py-3 font-display text-xs font-black tracking-[0.2em] text-omni-200 uppercase transition-colors hover:border-omni-400 hover:bg-omni-400/10"
            >
              සම්පූර්ණ උපදෙස් කියවන්න
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ------------------------------------------------ telegram */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <TelegramCta
          telegramUrl={settings.telegram_url}
          requestsUrl={settings.telegram_requests}
          members={settings.telegram_members || "12,400"}
        />
      </section>
    </div>
  );
}
