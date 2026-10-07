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

export default async function HomePage() {
  const [settings, categories, stats, featured, latest, trending, movies] = await Promise.all([
    getSettings(),
    listCategories(),
    getSiteStats(),
    getFeatured(6),
    getLatest(8),
    getTrending(6),
    getMovies(4),
  ]);

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
            kicker="Main collection"
            title="The Ben 10 collection"
            subtitle="From Classic to Omniverse — every series, with Sinhala audio and episodes in order."
            href="/releases"
            hrefLabel="All releases"
          />
        </Reveal>
        <CategoryGrid categories={categories} />
      </section>

      {/* ------------------------------------------------ featured */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            kicker="Watch now"
            title="Featured release"
            subtitle="Stream it right here with Sinhala audio — full release details are below."
          />
        </Reveal>
        <FeaturedPlayer release={heroRelease} youtubeUrl={settings.featured_youtube} />
      </section>

      {/* ------------------------------------------------ latest */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            kicker="Just added"
            title="Latest releases"
            subtitle="New episodes with Sinhala audio are added every week."
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
            No releases yet. Add the first one from the admin panel.
          </p>
        ) : null}
      </section>

      {/* ------------------------------------------------ trending rail */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Reveal>
          <ReleaseRail
            kicker="Most watched"
            title="Trending releases"
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
              kicker="Feature length"
              title="Movies & Specials"
              subtitle="Full-length films from outside the TV seasons — all with Sinhala audio."
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
            kicker="Omnitrix"
            title="The alien roster"
            subtitle="The powers locked inside Ben's watch — every alien brings its own strength."
          />
        </Reveal>
        <AlienStrip />
      </section>

      {/* ------------------------------------------------ how it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            align="center"
            kicker="Simple steps"
            title="Start watching in 30 seconds"
          />
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Pick a collection",
              text: "Choose Classic, Alien Force, Omniverse or any other series you want to watch.",
            },
            {
              step: "02",
              title: "Choose an episode",
              text: "Open an episode or movie from the releases page and pick a quality.",
            },
            {
              step: "03",
              title: "Watch or download",
              text: "Stream or download the Sinhala dub for free through Telegram or a mirror link.",
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
              Read the full guide
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
