import type { Metadata } from "next";
import Link from "next/link";

import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import TelegramCta from "@/components/TelegramCta";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "උදව් — බාගැනීමේ උපදෙස්",
  description: "සිංහල හඬකැවූ Ben 10 කථාංග නරඹන හා බාගන්නා ආකාරය පිළිබඳ පියවරෙන් පියවර උපදෙස්.",
};

const STEPS = [
  {
    title: "මාලාව තෝරන්න",
    text: "ඉහළ මෙනුවේ “මාලාවන්” වෙතින් ක්ලැසික්, එලියන් ෆෝස්, අල්ටිමේට් එලියන්, ඕම්නිවර්ස්, රීබූට් හෝ චිත්‍රපට එකතුවට යන්න.",
  },
  {
    title: "නිකුතුව විවෘත කරන්න",
    text: "කථාංග ලැයිස්තුවෙන් අවශ්‍ය කථාංගය මත ක්ලික් කරන්න. පිටුවේ කථා සාරාංශය, හඬකැවීමේ තොරතුරු සහ බාගැනීමේ සබැඳි පෙන්වයි.",
  },
  {
    title: "ගුණත්වය තෝරන්න",
    text: "480p (දත්ත අඩු), 720p හෝ 1080p (දත්ත වැඩි) සබැඳි අතරින් ඔබට ගැළපෙන එක තෝරන්න. සෑම සබැඳියකම ගොනු ප්‍රමාණය ද සටහන් කර ඇත.",
  },
  {
    title: "නරඹන්න හෝ බාගන්න",
    text: "සබැඳිය ටෙලිග්‍රෑම් වෙත යොමු කරයි. එහිදී ධාරාව (stream) කළ හැක, නැතහොත් බාගත කර ගත හැක. ටෙලිග්‍රෑම් යෙදුම ස්ථාපනය කර තිබීම පහසුවක්.",
  },
];

export default function HowToPage() {
  const settings = getSettings();

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <Reveal>
        <SectionHeading
          kicker="උපදෙස්"
          title="නරඹන්න හා බාගන්නේ කෙසේද?"
          subtitle="පළමු වරට පැමිණි අයට පියවර හතරකින් සම්පූර්ණයි. සියලුම නිකුතු නොමිලේ — ලියාපදිංචියක් අවශ්‍ය නැත."
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
          <h2 className="font-display text-base font-black text-white">නිතර අසන ප්‍රශ්න</h2>
          <dl className="mt-5 space-y-5 text-sm">
            {[
              {
                q: "කථාංග සිංහලෙන් ද?",
                a: "ඔව්. අපගේ සියලුම නිකුතු සිංහල හඬකැවීමෙන් යුක්තයි. පිටුවේ සෑම නිකුතුවකම “සිංහල හඬකැවීම” ලෙස පැහැදිලිව සටහන් කර ඇත.",
              },
              {
                q: "වීඩියෝ වෙබ් අඩවියේ ගබඩා වේද?",
                a: "නැත. අපි කිසිදු වීඩියෝ ගොනුවක් ගබඩා නොකරමු. සියලුම සබැඳි පිටත සේවාදායක හෝ ටෙලිග්‍රෑම් වෙත යොමු වේ.",
              },
              {
                q: "නව කථාංග කවදාද?",
                a: "සතියකට කථාංග කිහිපයක් සිංහල හඬකැවීමෙන් එක් කෙරේ. නවතම තොරතුරු ටෙලිග්‍රෑම් නාලිකාවෙන් ලැබේ.",
              },
              {
                q: "වැඩ නොකරන සබැඳියක් තිබේ නම්?",
                a: "ටෙලිග්‍රෑම් හරහා අපට දන්වන්න. අපි වහාම එය යාවත්කාලීන කරමු.",
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
            නිකුතු බලන්න
          </Link>
          <a
            href={settings.telegram_url}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-full border border-omni-400/40 px-6 py-3 font-display text-xs font-black tracking-wider text-omni-200 uppercase transition-colors hover:bg-omni-400/10"
          >
            උදව් ඉල්ලන්න
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
