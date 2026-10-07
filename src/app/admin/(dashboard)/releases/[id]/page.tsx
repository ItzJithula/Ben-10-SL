import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import ReleaseForm from "@/components/admin/ReleaseForm";
import Reveal from "@/components/Reveal";
import { deleteReleaseAction } from "@/lib/actions";
import { getReleaseById, listCategories } from "@/lib/queries";
import { formatDateSi, formatViews } from "@/lib/utils";

export const metadata: Metadata = {
  title: "නිකුතුව සංස්කරණය",
  robots: { index: false, follow: false },
};

type Params = Promise<{ id: string }>;

export default async function EditReleasePage({ params }: { params: Params }) {
  const { id } = await params;
  const releaseId = Number.parseInt(id, 10);
  if (!Number.isFinite(releaseId)) notFound();

  const release = getReleaseById(releaseId);
  if (!release) notFound();

  const categories = listCategories();

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="panel flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="min-w-0">
            <p className="text-[0.66rem] font-black tracking-[0.3em] text-omni-400 uppercase">
              නිකුතුව #{release.id} · {release.code}
            </p>
            <h1 className="mt-2 line-clamp-1 font-display text-xl font-black text-white">
              {release.title}
            </h1>
            <p className="mt-1 text-xs text-void-200">
              යාවත්කාලීන: {formatDateSi(release.updated_at)} · නැරඹුම් {formatViews(release.views)} · සබැඳි{" "}
              {release.qualities.length}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/release/${release.slug}`}
              className="rounded-full border border-omni-400/40 px-5 py-2.5 text-xs font-black tracking-wider text-omni-300 uppercase transition-colors hover:bg-omni-400/10"
            >
              පෙරදසුන
            </Link>
            <Link
              href="/admin/releases"
              className="rounded-full border border-void-500 px-5 py-2.5 text-xs font-black tracking-wider text-void-100 uppercase transition-colors hover:border-omni-400/50 hover:text-omni-300"
            >
              ← ලැයිස්තුව
            </Link>
            <form action={deleteReleaseAction}>
              <input type="hidden" name="id" value={release.id} />
              <ConfirmSubmit
                className="border-alien-red/40 px-5 py-2.5 text-[0.68rem] tracking-wider text-alien-red uppercase hover:bg-alien-red/10"
                message={`“${release.title}” ඉවත් කරන්නද? මෙය ආපසු හැරවිය නොහැක.`}
              >
                නිකුතුව ඉවත් කරන්න
              </ConfirmSubmit>
            </form>
          </div>
        </div>
      </Reveal>

      <ReleaseForm categories={categories} release={release} />
    </div>
  );
}
