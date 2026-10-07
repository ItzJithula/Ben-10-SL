import Link from "next/link";
import { OmnitrixMark } from "./OmnitrixWatch";
import { cx } from "@/lib/utils";

export default function SectionHeading({
  kicker,
  title,
  subtitle,
  href,
  hrefLabel = "සියල්ල බලන්න",
  align = "left",
  className,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cx(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <div className={cx("max-w-2xl", align === "center" && "mx-auto text-center")}>
        {kicker ? (
          <p className="mb-2 flex items-center gap-2 text-[0.68rem] font-black tracking-[0.34em] text-omni-400 uppercase">
            {align !== "center" && <OmnitrixMark size={14} className="text-omni-400" />}
            {kicker}
          </p>
        ) : null}
        <h2 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
          {title}
        </h2>
        {subtitle ? <p className="mt-3 text-sm leading-relaxed text-void-100">{subtitle}</p> : null}
      </div>

      {href ? (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-omni-400/35 px-4 py-2 text-sm font-bold text-omni-300 transition-colors hover:border-omni-400 hover:bg-omni-400/10"
        >
          {hrefLabel}
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      ) : null}
    </div>
  );
}
