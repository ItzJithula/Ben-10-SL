import Link from "next/link";

import OmnitrixWatch from "@/components/OmnitrixWatch";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
      <OmnitrixWatch size={200} />
      <p className="mt-10 font-display text-6xl font-black text-omni-400/25">404</p>
      <h1 className="mt-2 font-display text-2xl font-black text-white sm:text-3xl">
        මෙම පිටුව හමු නොවිණි
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-void-100">
        ඔබ සොයන නිකුතුව ඉවත් කර ඇත, නැතහොත් අන්තර්ජාල සබැඳිය වැරදිය.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/"
          className="rounded-full bg-linear-to-r from-omni-400 to-omni-600 px-6 py-3 font-display text-xs font-black tracking-wider text-void-950 uppercase"
        >
          මුල් පිටුවට
        </Link>
        <Link
          href="/releases"
          className="rounded-full border border-omni-400/40 px-6 py-3 font-display text-xs font-black tracking-wider text-omni-200 uppercase transition-colors hover:bg-omni-400/10"
        >
          නිකුතු බලන්න
        </Link>
      </div>
    </div>
  );
}
