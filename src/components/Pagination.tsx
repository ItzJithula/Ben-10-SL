import Link from "next/link";
import { cx } from "@/lib/utils";

export default function Pagination({
  page,
  pages,
  makeHref,
}: {
  page: number;
  pages: number;
  makeHref: (page: number) => string;
}) {
  if (pages <= 1) return null;

  const windowSize = 2;
  const numbers: (number | "gap")[] = [];
  for (let index = 1; index <= pages; index += 1) {
    if (index === 1 || index === pages || Math.abs(index - page) <= windowSize) {
      numbers.push(index);
    } else if (numbers[numbers.length - 1] !== "gap") {
      numbers.push("gap");
    }
  }

  return (
    <nav className="mt-12 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      <Link
        href={makeHref(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={cx(
          "rounded-full border px-4 py-2 text-sm font-bold transition-colors",
          page === 1
            ? "pointer-events-none border-void-600 text-void-400"
            : "border-omni-400/30 text-omni-300 hover:border-omni-400 hover:bg-omni-400/10",
        )}
      >
        ← Prev
      </Link>

      {numbers.map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="px-2 text-void-300">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={makeHref(item)}
            className={cx(
              "min-w-10 rounded-full border px-3 py-2 text-center text-sm font-bold transition-all",
              item === page
                ? "border-omni-400 bg-omni-400 text-void-950 shadow-omni"
                : "border-void-600 text-void-100 hover:border-omni-400/60 hover:text-omni-300",
            )}
          >
            {item}
          </Link>
        ),
      )}

      <Link
        href={makeHref(Math.min(pages, page + 1))}
        aria-disabled={page === pages}
        className={cx(
          "rounded-full border px-4 py-2 text-sm font-bold transition-colors",
          page === pages
            ? "pointer-events-none border-void-600 text-void-400"
            : "border-omni-400/30 text-omni-300 hover:border-omni-400 hover:bg-omni-400/10",
        )}
      >
        Next →
      </Link>
    </nav>
  );
}
