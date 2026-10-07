import type { Metadata } from "next";
import Link from "next/link";

import Reveal from "@/components/Reveal";
import { getAdminStats } from "@/lib/queries";
import { formatDateSi, formatViews, truncate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "පරිපාලක එක්ස්කෑප්",
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  const stats = getAdminStats();
  const maxCount = Math.max(1, ...stats.perCategory.map((item) => item.count));

  const cards = [
    { label: "මුළු නිකුතු", value: stats.releases, accent: "#39FF14", hint: "සියලු මාලාවන්" },
    { label: "ප්‍රකාශිත", value: stats.published, accent: "#00E5FF", hint: "වෙබ් අඩවියේ පෙනෙන" },
    { label: "කෙටුම්පත්", value: stats.drafts, accent: "#FFC400", hint: "ප්‍රකාශිත නොවූ" },
    { label: "මාලාවන්", value: stats.categories, accent: "#B026FF", hint: "ප්‍රධාන එකතු" },
    { label: "චිත්‍රපට", value: stats.movieCount, accent: "#FF2E88", hint: "සම්පූර්ණ දිග" },
    { label: "බාගැනීම් සබැඳි", value: stats.linkCount, accent: "#FF7A00", hint: "සියලු ගුණත්ව" },
    { label: "නැරඹුම්", value: formatViews(stats.totalViews), accent: "#7DFF3D", hint: "මුළු ගණන" },
    { label: "අද වැඩ", value: new Date().getDate(), accent: "#00E5FF", hint: "දිනපතා" },
  ];

  return (
    <div className="space-y-8">
      <Reveal>
        <div className="panel flex flex-wrap items-center justify-between gap-5 p-6">
          <div>
            <p className="text-[0.66rem] font-black tracking-[0.3em] text-omni-400 uppercase">
              පරිපාලක පැනලය
            </p>
            <h1 className="mt-2 font-display text-2xl font-black text-white">
              ආයුබෝවන් — එක්ස්කෑප්
            </h1>
            <p className="mt-2 text-sm text-void-100">
              මෙතැනින් නව නිකුතු එක් කරන්න, මාලාවන් කළමනාකරණය කරන්න හෝ වෙබ් අඩවියේ තොරතුරු යාවත්කාලීන කරන්න.
            </p>
          </div>
          <Link
            href="/admin/releases/new"
            className="rounded-full bg-linear-to-r from-omni-300 via-omni-400 to-omni-600 px-6 py-3 font-display text-xs font-black tracking-[0.2em] text-void-950 uppercase shadow-omni transition-transform hover:scale-[1.03]"
          >
            + නව නිකුතුවක්
          </Link>
        </div>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Reveal key={card.label}>
            <div
              className="panel relative overflow-hidden p-5"
              style={{ borderColor: `${card.accent}33` }}
            >
              <span
                className="absolute -top-10 -right-10 h-24 w-24 rounded-full opacity-20 blur-2xl"
                style={{ background: card.accent }}
              />
              <p className="text-[0.62rem] font-black tracking-[0.24em] text-void-200 uppercase">
                {card.label}
              </p>
              <p className="mt-2 font-display text-3xl font-black" style={{ color: card.accent }}>
                {card.value}
              </p>
              <p className="mt-1 text-[0.68rem] text-void-300">{card.hint}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="panel p-6">
            <h2 className="mb-5 font-display text-sm font-black tracking-[0.2em] text-omni-300 uppercase">
              මාලාවන් අනුව නිකුතු
            </h2>
            <div className="space-y-4">
              {stats.perCategory.map((item) => (
                <div key={item.slug}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <Link
                      href={`/category/${item.slug}`}
                      className="font-bold text-void-50 hover:text-omni-300"
                    >
                      {item.name_si || item.name}
                    </Link>
                    <span className="font-black" style={{ color: item.accent }}>
                      {item.count}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-void-700">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(item.count / maxCount) * 100}%`,
                        background: `linear-gradient(90deg, ${item.accent}, ${item.accent}55)`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="panel p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-sm font-black tracking-[0.2em] text-omni-300 uppercase">
                අලුත්ම නිකුතු
              </h2>
              <Link
                href="/admin/releases"
                className="text-[0.68rem] font-black tracking-wider text-omni-400 uppercase hover:text-omni-300"
              >
                සියල්ල →
              </Link>
            </div>

            <div className="space-y-3">
              {stats.latest.map((release) => (
                <Link
                  key={release.id}
                  href={`/admin/releases/${release.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-void-700 p-2.5 transition-colors hover:border-omni-400/50 hover:bg-omni-400/5"
                >
                  <span className="h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-void-800">
                    {release.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={release.thumbnail}
                        alt={release.title}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 block text-sm font-bold text-white group-hover:text-omni-300">
                      {release.title}
                    </span>
                    <span className="mt-0.5 block text-[0.66rem] text-void-200">
                      {release.category_name} · {release.status === "published" ? "ප්‍රකාශිත" : "කෙටුම්පත"} ·{" "}
                      {formatDateSi(release.created_at)}
                    </span>
                  </span>
                </Link>
              ))}

              {stats.latest.length === 0 ? (
                <p className="text-sm text-void-200">එක්ස්කෑප් එක හිස් — පළමු නිකුතුව එක් කරන්න.</p>
              ) : null}
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal>
        <div className="panel p-6">
          <h2 className="mb-4 font-display text-sm font-black tracking-[0.2em] text-omni-300 uppercase">
            ඉක්මන් ක්‍රියා
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/releases/new"
              className="rounded-full border border-omni-400/40 px-5 py-2.5 text-xs font-black tracking-wider text-omni-300 uppercase transition-colors hover:bg-omni-400/10"
            >
              නව නිකුතුව
            </Link>
            <Link
              href="/admin/categories"
              className="rounded-full border border-omni-400/40 px-5 py-2.5 text-xs font-black tracking-wider text-omni-300 uppercase transition-colors hover:bg-omni-400/10"
            >
              මාලාවක් එක් කරන්න
            </Link>
            <Link
              href="/admin/settings"
              className="rounded-full border border-omni-400/40 px-5 py-2.5 text-xs font-black tracking-wider text-omni-300 uppercase transition-colors hover:bg-omni-400/10"
            >
              වෙබ් අඩවි සැකසුම්
            </Link>
            <Link
              href="/"
              className="rounded-full border border-void-500 px-5 py-2.5 text-xs font-black tracking-wider text-void-100 uppercase transition-colors hover:border-omni-400/50 hover:text-omni-300"
            >
              වෙබ් අඩවිය බලන්න
            </Link>
          </div>
          <p className="mt-5 rounded-xl border border-void-600 bg-void-950/60 p-4 text-[0.7rem] leading-relaxed text-void-200">
            <strong className="text-void-100">සටහන:</strong> {truncate(
              "සියලුම නිකුතු සිංහල හඬකැවීම ලෙසම සුරැකේ. නිකුත් කේතය (code) අනන්‍ය විය යුතුය; එකම කේතයක් දෙවරක් භාවිතා නොකරන්න.",
              140,
            )}
          </p>
        </div>
      </Reveal>
    </div>
  );
}
