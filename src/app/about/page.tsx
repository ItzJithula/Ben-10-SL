import type { Metadata } from "next";

import AlienStrip from "@/components/AlienStrip";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import { WatchFrame } from "@/components/OmnitrixWatch";
import OmnitrixWatch from "@/components/OmnitrixWatch";
import { getSiteStats, listCategories } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "අප ගැන",
  description: "Ben 10 SL — සිංහල හඬකැවූ Ben 10 නිකුතු පිළිබඳ රසික පිටුවක්.",
};

export default function AboutPage() {
  const settings = getSettings();
  const categories = listCategories();
  const stats = getSiteStats();

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <section className="grid items-center gap-12 lg:grid-cols-[1.3fr_0.7fr]">
        <Reveal>
          <div>
            <p className="mb-3 text-[0.66rem] font-black tracking-[0.34em] text-omni-400 uppercase">
              අපගේ කථාව
            </p>
            <h1 className="font-display text-3xl font-black text-white sm:text-4xl">
              සිංහල බෙන් 10 රසිකයන් සඳහාම
            </h1>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-void-100 sm:text-base">
              <p>
                {settings.site_description}
              </p>
              <p>
                අපගේ අරමුණ එකයි — ලංකාවේ Ben 10 රසිකයන්ට සියලුම කථාංග <strong className="text-omni-300">සිංහල
                හඬකැවීමෙන්</strong> එකම තැනකින්, පහසුවෙන් සහ නොමිලේ සොයා ගැනීමට ඉඩ සැලසීමයි. එම නිසා අපගේ
                පුස්තකාලයේ ඇත්තේ සිංහල හඬකැවූ නිකුතු පමණි.
              </p>
              <p>
                සෑම නිකුතුවක්ම ප්‍රධාන එකතුවලට වර්ග කර ඇත — ක්ලැසික්, එලියන් ෆෝස්, අල්ටිමේට් එලියන්, ඕම්නිවර්ස්,
                රීබූට් සහ චිත්‍රපට/විශේෂ. කථාංග අනුපිළිවෙල, ගුණත්ව මට්ටම් (480p/720p/1080p), හඬකැවීමේ ස්ටුඩියෝව
                සහ දිනයන් ඇතුළු සියලු තොරතුරු එක් එක් නිකුතු පිටුවේ ඇත.
              </p>
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-4">
              {[
                { label: "නිකුතු", value: stats.releases },
                { label: "කථාංග", value: stats.episodes },
                { label: "චිත්‍රපට", value: stats.movies },
                { label: "මාලාවන්", value: categories.length },
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
            kicker="අපගේ මූලධර්ම"
            title="අප විශ්වාස කරන දේ"
          />
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              title: "සිංහල හඬකැවීම පමණයි",
              text: "අපගේ සියලුම නිකුතු සිංහල හඬකැවීමෙන් යුක්තය. සිංහල උපසිරැසි සහිත මුල් හඬ පිටපත් ඇත්නම් ඒවා වෙනම සටහන් කර ඇත.",
              color: "#39FF14",
            },
            {
              title: "නොමිලේ හා විවෘත",
              text: "නරඹීමට හෝ බාගැනීමට කිසිදු ගෙවීමක් නොමැත. සබැඳි ටෙලිග්‍රෑම් හරහා සෘජුවම ලබා දේ.",
              color: "#00E5FF",
            },
            {
              title: "රසිකයන් විසින්ම",
              text: "මෙය රසිකයන් විසින් නිර්මිත පිටුවකි. සියලුම අයිතිවාසිකම් මුල් හිමිකරුවන් සතුය.",
              color: "#FF2E88",
            },
          ].map((item, index) => (
            <Reveal key={item.title} delay={index * 0.08}>
              <WatchFrame className="h-full">
                <div className="h-full p-6">
                  <span
                    className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border font-display text-sm font-black"
                    style={{ borderColor: `${item.color}66`, color: item.color, background: `${item.color}12` }}
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
          <SectionHeading align="center" kicker="ඔම්නිට්‍රික්ස්" title="එලියන් බලකාය" />
        </Reveal>
        <AlienStrip />
      </section>

      <section className="mt-20">
        <Reveal>
          <div className="panel p-7">
            <h2 className="font-display text-lg font-black text-white">වගකීම් ප්‍රතික්ෂේප කිරීම</h2>
            <p className="mt-3 text-sm leading-relaxed text-void-100">{settings.disclaimer}</p>
            <p className="mt-4 text-sm leading-relaxed text-void-100">
              අපගේ වෙබ් අඩවියේ කිසිදු වීඩියෝ ගොනුවක් දේශීයව ගබඩා නොකෙරේ. සියලුම සබැඳි පිටත සේවාදායකයන් වෙත
              යොමු කෙරේ. කිසියම් අයිතිවාසිකම් උල්ලංඝනයක් සිදුව ඇතැයි සිතේ නම්, අප හා සම්බන්ධ වන්න — අදාළ සබැඳි
              වහාම ඉවත් කරනු ලැබේ.
            </p>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
