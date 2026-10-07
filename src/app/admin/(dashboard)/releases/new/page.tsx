import type { Metadata } from "next";
import Link from "next/link";

import ReleaseForm from "@/components/admin/ReleaseForm";
import Reveal from "@/components/Reveal";
import { listCategories } from "@/lib/queries";

export const metadata: Metadata = {
  title: "නව නිකුතුවක්",
  robots: { index: false, follow: false },
};

export default function NewReleasePage() {
  const categories = listCategories();

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="panel flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="text-[0.66rem] font-black tracking-[0.3em] text-omni-400 uppercase">
              නව නිකුතුව
            </p>
            <h1 className="mt-2 font-display text-xl font-black text-white">
              සිංහල හඬකැවූ නිකුතුවක් එක් කරන්න
            </h1>
            <p className="mt-1 text-sm text-void-100">
              පියවර 4 පුරවා “නිකුතුව ප්‍රකාශ කරන්න” ඔබන්න. පසුව ඕනෑම වේලාවක සංස්කරණය කළ හැක.
            </p>
          </div>
          <Link
            href="/admin/releases"
            className="rounded-full border border-void-500 px-5 py-2.5 text-xs font-black tracking-wider text-void-100 uppercase transition-colors hover:border-omni-400/50 hover:text-omni-300"
          >
            ← නිකුතු ලැයිස්තුව
          </Link>
        </div>
      </Reveal>

      <ReleaseForm categories={categories} />
    </div>
  );
}
