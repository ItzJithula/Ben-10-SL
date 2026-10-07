import type { Metadata } from "next";

import AlienStrip from "@/components/AlienStrip";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import OmnitrixWatch, { WatchFrame } from "@/components/OmnitrixWatch";
import { getSiteStats, listCategories } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "About",
  description:
    "Ben 10 SL is a fan-run archive of Ben 10 episodes and movies with Sinhala audio, organised by series.",
};

export default async function AboutPage() {
  const [settings, categories, stats] = await Promise.all([
    getSettings(),
    listCategories(),
    getSiteStats(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <section className="grid items-center gap-12 lg:grid-cols-[1.3fr_0.7fr]">
        <Reveal>
          <div>
            <p className="mb-3 text-[0.66rem] font-black tracking-[0.34em] text-omni-400 uppercase">
              Our story
            </p>
            <h1 className="font-display text-3xl font-black text-white sm:text-4xl">
              Built for Sinhala Ben 10 fans
            </h1>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-void-100 sm:text-base">
              <p>{settings.site_description}</p>
              <p>
                Our goal is simple: make every Ben 10 episode easy to find with{" "}
                <strong className="text-omni-300">Sinhala audio</strong>, in one place and free to
                watch. That is why the library only ever holds Sinhala dubbed releases — nothing else.
              </p>
              <p>
                Every release is filed under its main collection — Classic, Alien Force, Ultimate
                Alien, Omniverse, Reboot and Movies &amp; Specials. Episode order, available
                qualities (480p / 720p / 1080p), dub studio and dates are all listed on the release
                page, so you always know exactly what you are downloading.
              </p>
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-4">
              {[
                { label: "Releases", value: stats.releases },
                { label: "Episodes", value: stats.episodes },
                { label: "Movies", value: stats.movies },
                { label: "Collections", value: categories.length },
              ].map((item) => (
                <div key={item.label} className="panel p-4">
                  <dt className="text-[0.62rem] font-black tracking-[0.24em] text-void-200 uppercase">
                    {item.label}
                  </dt>
                  <dd className="font-display text-2xl font-black text-omni-300">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>

        <Reveal direction="left">
          <div className="flex justify-center">
            <OmnitrixWatch size={280} />
          </div>
        </Reveal>
      </section>

      <section className="mt-20">
        <Reveal>
          <SectionHeading
            align="center"
            kicker="What we stand for"
            title="How this page works"
          />
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              title: "Sinhala dub, always",
              text: "Every release in the library carries Sinhala audio. Nothing else is published here, and the admin panel only allows Sinhala releases.",
              color: "#39FF14",
            },
            {
              title: "Free and open",
              text: "No payments, no accounts, no waiting. Links go straight to Telegram so you can stream or download immediately.",
              color: "#00E5FF",
            },
            {
              title: "Run by fans",
              text: "This is an unofficial fan project. All characters, artwork and series titles belong to their original rights holders.",
              color: "#FF2E88",
            },
          ].map((item, index) => (
            <Reveal key={item.title} delay={index * 0.08}>
              <WatchFrame className="h-full">
                <div className="h-full p-6">
                  <span
                    className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border font-display text-sm font-black"
                    style={{
                      borderColor: `${item.color}66`,
                      color: item.color,
                      background: `${item.color}12`,
                    }}
                  >
                    {index + 1}
                  </span>
                  <h3 className="font-display text-base font-black text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-void-100">{item.text}</p>
                </div>
              </WatchFrame>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <Reveal>
          <SectionHeading align="center" kicker="Omnitrix" title="The alien roster" />
        </Reveal>
        <AlienStrip />
      </section>

      <section className="mt-20">
        <Reveal>
          <div className="panel p-7">
            <h2 className="font-display text-lg font-black text-white">Disclaimer</h2>
            <p className="mt-3 text-sm leading-relaxed text-void-100">{settings.disclaimer}</p>
            <p className="mt-4 text-sm leading-relaxed text-void-100">
              No video file is hosted on this website — every link points to an external service. If
              you believe something here infringes your rights, contact us and the relevant links
              will be removed straight away.
            </p>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
