import type { Metadata } from "next";
import Link from "next/link";

import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import TelegramCta from "@/components/TelegramCta";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Help — How to watch & download",
  description:
    "Step-by-step guide to watching and downloading Ben 10 episodes with Sinhala audio from Ben 10 SL.",
};

const STEPS = [
  {
    title: "Pick a collection",
    text: "Open “Collections” in the top menu and choose Classic, Alien Force, Ultimate Alien, Omniverse, Reboot or Movies & Specials.",
  },
  {
    title: "Open a release",
    text: "Click an episode in the list. The release page shows the synopsis, dub details and every download link that is available.",
  },
  {
    title: "Choose a quality",
    text: "Pick 480p for smaller files, 720p for a balance, or 1080p for the sharpest picture. The file size is listed next to each link.",
  },
  {
    title: "Watch or download",
    text: "Links open on Telegram, where you can stream the episode straight away or save it to your device. Having the Telegram app installed makes it smoother.",
  },
];

export default async function HowToPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <Reveal>
        <SectionHeading
          kicker="Guide"
          title="How to watch and download"
          subtitle="Four steps and you are done. Everything on this site is free — no account, no sign-up, no payment."
        />
      </Reveal>

      <div className="space-y-5">
        {STEPS.map((step, index) => (
          <Reveal key={step.title} delay={index * 0.06} direction="right">
            <div className="panel panel-hover relative overflow-hidden p-6 sm:p-7">
              <span className="font-display absolute -top-6 right-4 text-8xl font-black text-omni-400/10">
                {index + 1}
              </span>
              <div className="relative flex gap-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-omni-400/45 bg-omni-400/10 font-display text-sm font-black text-omni-300">
                  0{index + 1}
                </span>
                <div>
                  <h2 className="font-display text-base font-black text-white sm:text-lg">
                    {step.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-void-100">{step.text}</p>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="panel mt-10 p-7">
          <h2 className="font-display text-base font-black text-white">Frequently asked questions</h2>
          <dl className="mt-5 space-y-5 text-sm">
            {[
              {
                q: "Are the episodes really in Sinhala?",
                a: "Yes. Every single release in the library carries Sinhala audio, and each release page is labelled “Sinhala Dub” so there is no confusion.",
              },
              {
                q: "Are the videos hosted on this site?",
                a: "No. We do not store any video files. All links point to an external service or a Telegram channel.",
              },
              {
                q: "How often are new episodes added?",
                a: "A few episodes are added every week with Sinhala audio. Follow the Telegram channel to hear about them first.",
              },
              {
                q: "What if a link does not work?",
                a: "Send us a message on Telegram and we will refresh that link as soon as possible.",
              },
            ].map((item) => (
              <div key={item.q} className="border-b border-void-700/70 pb-4 last:border-0">
                <dt className="font-bold text-omni-200">{item.q}</dt>
                <dd className="mt-1.5 leading-relaxed text-void-100">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Reveal>

      <Reveal>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/releases"
            className="rounded-full bg-linear-to-r from-omni-400 to-omni-600 px-6 py-3 font-display text-xs font-black tracking-wider text-void-950 uppercase"
          >
            Browse releases
          </Link>
          <a
            href={settings.telegram_url}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-full border border-omni-400/40 px-6 py-3 font-display text-xs font-black tracking-wider text-omni-200 uppercase transition-colors hover:bg-omni-400/10"
          >
            Ask for help
          </a>
        </div>
      </Reveal>

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
