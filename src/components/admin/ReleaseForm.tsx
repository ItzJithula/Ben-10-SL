"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { saveReleaseAction, type ActionState } from "@/lib/actions";
import { cx, slugify } from "@/lib/utils";
import type { CategoryWithCount, QualityInput, ReleaseDetail } from "@/lib/types";

const INITIAL: ActionState = { ok: false, message: "" };

const TYPES = [
  { value: "episode", label: "Episode" },
  { value: "movie", label: "Movie" },
  { value: "special", label: "Special" },
  { value: "short", label: "Short" },
];

const QUALITY_PRESETS = ["480p", "720p", "1080p", "1440p", "2160p", "HD", "FHD"];

function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[0.68rem] font-black tracking-[0.2em] text-void-100 uppercase">
          {label}
        </span>
        {hint ? <span className="text-[0.62rem] text-void-300">{hint}</span> : null}
      </span>
      {children}
      {error ? <span className="mt-1 block text-[0.68rem] font-bold text-alien-red">{error}</span> : null}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-void-500 bg-void-950/80 px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-void-400 focus:border-omni-400/70";

export default function ReleaseForm({
  categories,
  release,
}: {
  categories: CategoryWithCount[];
  release?: ReleaseDetail | null;
}) {
  const [state, formAction, pending] = useActionState(saveReleaseAction, INITIAL);

  const [categoryId, setCategoryId] = useState<number>(
    release?.category_id ?? (categories[0]?.id || 1)
  );
  const [season, setSeason] = useState<number>(release?.season ?? 1);
  const [episodeNumber, setEpisodeNumber] = useState<string | number>(
    release?.episode_number ?? ""
  );
  const [episodeType, setEpisodeType] = useState<string>(
    release?.episode_type ?? "episode"
  );

  function getAutoCode(catId: number, s: number, ep: string | number, type: string) {
    const cat = categories.find((c) => c.id === Number(catId));
    const slugMap: Record<string, string> = {
      classic: "B10-CL",
      "alien-force": "B10-AF",
      "ultimate-alien": "B10-UA",
      omniverse: "B10-OV",
      reboot: "B10-RB",
      "movies-specials": "B10-MV",
    };
    const prefix =
      (cat && slugMap[cat.slug]) ||
      (cat ? `B10-${cat.slug.slice(0, 3).toUpperCase()}` : "B10");
    if (type === "movie") return `${prefix}-MOV-${String(ep || 1).padStart(2, "0")}`;
    if (type === "special") return `${prefix}-SP-${String(ep || 1).padStart(2, "0")}`;
    if (ep !== "" && ep !== null && ep !== undefined && !isNaN(Number(ep))) {
      return `${prefix}-${String(ep).padStart(3, "0")}`;
    }
    return `${prefix}-S${String(s || 1).padStart(2, "0")}`;
  }

  const [code, setCode] = useState(
    release?.code || getAutoCode(categoryId, season, episodeNumber, episodeType)
  );
  const [codeTouched, setCodeTouched] = useState(Boolean(release?.code));

  const [slug, setSlug] = useState(release?.slug || (release?.title ? slugify(release.title) : ""));
  const [slugTouched, setSlugTouched] = useState(Boolean(release?.slug));
  const [title, setTitle] = useState(release?.title ?? "");
  const [qualities, setQualities] = useState<QualityInput[]>(
    release?.qualities.map((quality) => ({
      label: quality.label,
      url: quality.url,
      file_size_mb: quality.file_size_mb,
    })) ?? [{ label: "720p", url: "", file_size_mb: null }],
  );

  const qualitiesJson = useMemo(() => JSON.stringify(qualities), [qualities]);

  const update = (index: number, patch: Partial<QualityInput>) => {
    setQualities((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  return (
    <form action={formAction} className="space-y-6">
      {release ? <input type="hidden" name="id" value={release.id} /> : null}
      <input type="hidden" name="qualities_json" value={qualitiesJson} />
      <input type="hidden" name="language" value="sinhala" />
      {/* Hidden dub fields to maintain backwards compatibility while Dub Information UI is removed */}
      <input type="hidden" name="dubbed_studio" value={release?.dubbed_studio || "Cartoon Network (Sinhala dub)"} />
      <input type="hidden" name="dubbed_date" value={release?.dubbed_date || ""} />
      <input type="hidden" name="aired_date" value={release?.aired_date || ""} />

      {state.message && !state.ok ? (
        <p className="rounded-xl border border-alien-red/40 bg-alien-red/10 px-4 py-3 text-xs font-bold text-alien-red">
          {state.message}
        </p>
      ) : null}

      {/* ---------------------------------------------------- basics */}
      <section className="panel p-6">
        <h2 className="mb-5 font-display text-sm font-black tracking-[0.2em] text-omni-300 uppercase">
          1 · Basics
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Collection" error={state.fieldErrors?.category_id}>
            <select
              name="category_id"
              value={categoryId}
              onChange={(event) => {
                const newCatId = Number(event.target.value);
                setCategoryId(newCatId);
                if (!codeTouched) {
                  setCode(getAutoCode(newCatId, season, episodeNumber, episodeType));
                }
              }}
              className={inputClass}
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Release code"
            hint={
              <button
                type="button"
                onClick={() => {
                  setCodeTouched(false);
                  setCode(getAutoCode(categoryId, season, episodeNumber, episodeType));
                }}
                className="text-[0.62rem] font-bold text-omni-300 hover:underline"
              >
                ⚡ Auto-generate
              </button> as unknown as string
            }
          >
            <div className="relative">
              <input
                name="code"
                value={code}
                onChange={(event) => {
                  setCodeTouched(true);
                  setCode(event.target.value);
                }}
                className={inputClass}
                placeholder="e.g. B10-CL-001"
              />
              {!codeTouched ? (
                <span className="pointer-events-none absolute right-3 top-2.5 rounded bg-omni-400/20 px-2 py-0.5 text-[0.6rem] font-black tracking-wider text-omni-300 uppercase">
                  Auto
                </span>
              ) : null}
            </div>
          </Field>

          <Field label="Title" error={state.fieldErrors?.title}>
            <input
              name="title"
              value={title}
              onChange={(event) => {
                const val = event.target.value;
                setTitle(val);
                if (!slugTouched) setSlug(slugify(val));
              }}
              className={inputClass}
              placeholder="And Then There Were 10"
              required
            />
          </Field>

          <Field label="Alternative title" hint="optional · shown as a subtitle">
            <input
              name="subtitle"
              defaultValue={release?.subtitle ?? ""}
              className={inputClass}
              placeholder="Ben 10 Classic · Season 1"
            />
          </Field>

          <Field
            label="URL slug"
            hint={
              <button
                type="button"
                onClick={() => {
                  setSlugTouched(false);
                  setSlug(slugify(title));
                }}
                className="text-[0.62rem] font-bold text-omni-300 hover:underline"
              >
                ⚡ Auto-generate
              </button> as unknown as string
            }
          >
            <div className="relative">
              <input
                name="slug"
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(slugify(event.target.value));
                }}
                className={inputClass}
                placeholder="and-then-there-were-10"
                required
              />
              {!slugTouched ? (
                <span className="pointer-events-none absolute right-3 top-2.5 rounded bg-omni-400/20 px-2 py-0.5 text-[0.6rem] font-black tracking-wider text-omni-300 uppercase">
                  Auto
                </span>
              ) : null}
            </div>
          </Field>

          <Field label="Episode type">
            <select
              name="episode_type"
              value={episodeType}
              onChange={(event) => {
                const newType = event.target.value;
                setEpisodeType(newType);
                if (!codeTouched) {
                  setCode(getAutoCode(categoryId, season, episodeNumber, newType));
                }
              }}
              className={inputClass}
            >
              {TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-5">
            <Field label="Season">
              <input
                name="season"
                type="number"
                min={0}
                value={season}
                onChange={(event) => {
                  const newSeason = Number(event.target.value);
                  setSeason(newSeason);
                  if (!codeTouched) {
                    setCode(getAutoCode(categoryId, newSeason, episodeNumber, episodeType));
                  }
                }}
                className={inputClass}
              />
            </Field>
            <Field label="Episode number">
              <input
                name="episode_number"
                type="number"
                min={0}
                value={episodeNumber}
                onChange={(event) => {
                  const newEp = event.target.value;
                  setEpisodeNumber(newEp);
                  if (!codeTouched) {
                    setCode(getAutoCode(categoryId, season, newEp, episodeType));
                  }
                }}
                className={inputClass}
                placeholder="1"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Field label="Quality">
              <input
                name="quality"
                list="quality-presets"
                defaultValue={release?.quality ?? "720p"}
                className={inputClass}
              />
              <datalist id="quality-presets">
                {QUALITY_PRESETS.map((preset) => (
                  <option key={preset} value={preset} />
                ))}
              </datalist>
            </Field>
            <Field label="Runtime (minutes)">
              <input
                name="duration_minutes"
                type="number"
                min={1}
                defaultValue={release?.duration_minutes ?? 22}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Status">
            <select name="status" defaultValue={release?.status ?? "published"} className={inputClass}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </Field>

          <label className="flex items-center gap-3 rounded-xl border border-void-500 bg-void-950/60 px-4 py-3">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={release?.featured === 1}
              className="h-4 w-4 accent-[#39ff14]"
            />
            <span className="text-sm font-bold text-void-50">Feature this release on the home page</span>
          </label>
        </div>
      </section>

      {/* ---------------------------------------------------- content */}
      <section className="panel p-6">
        <h2 className="mb-5 font-display text-sm font-black tracking-[0.2em] text-omni-300 uppercase">
          2 · Details & media
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Synopsis" className="sm:col-span-2">
            <textarea
              name="synopsis"
              defaultValue={release?.synopsis ?? ""}
              rows={5}
              className={cx(inputClass, "resize-y leading-relaxed")}
              placeholder="What happens in this episode?"
            />
          </Field>

          <Field label="Thumbnail URL" hint="https://… or /art/…">
            <input
              name="thumbnail"
              defaultValue={release?.thumbnail ?? ""}
              className={inputClass}
              placeholder="https://i.ibb.co/…jpg"
            />
          </Field>

          <Field label="Tags" hint="comma separated">
            <input
              name="tags"
              defaultValue={release?.tags ?? ""}
              className={inputClass}
              placeholder="fight,aliens,special"
            />
          </Field>

          <Field label="Source">
            <input
              name="source"
              defaultValue={release?.source ?? ""}
              className={inputClass}
              placeholder="Cartoon Network (Sinhala dub)"
            />
          </Field>

          <Field label="Telegram link">
            <input
              name="telegram_url"
              defaultValue={release?.telegram_url ?? ""}
              className={inputClass}
              placeholder="https://t.me/…"
            />
          </Field>

          <Field
            label="Direct Video URL (Video.js Player)"
            hint="direct .mp4, .m3u8 (HLS), or stream link for the online player"
            className="sm:col-span-2"
          >
            <input
              name="video_url"
              defaultValue={release?.video_url ?? ""}
              className={inputClass}
              placeholder="https://example.com/stream/episode-1.mp4"
            />
          </Field>
        </div>
      </section>

      {/* ---------------------------------------------------- links */}
      <section className="panel p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="font-display text-sm font-black tracking-[0.2em] text-omni-300 uppercase">
            3 · Download links
          </h2>
          <button
            type="button"
            onClick={() =>
              setQualities((rows) => [...rows, { label: "720p", url: "", file_size_mb: null }])
            }
            className="rounded-full border border-omni-400/40 px-4 py-2 text-xs font-black tracking-wider text-omni-300 uppercase transition-colors hover:bg-omni-400/10"
          >
            + Add link
          </button>
        </div>

        <div className="space-y-3">
          {qualities.map((quality, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-xl border border-void-600 bg-void-950/50 p-3 sm:grid-cols-[110px_1fr_120px_auto]"
            >
              <input
                value={quality.label}
                onChange={(event) => update(index, { label: event.target.value })}
                placeholder="720p"
                className={inputClass}
              />
              <input
                value={quality.url}
                onChange={(event) => update(index, { url: event.target.value })}
                placeholder="https://t.me/… or a YouTube link"
                className={inputClass}
              />
              <input
                value={quality.file_size_mb ?? ""}
                onChange={(event) =>
                  update(index, {
                    file_size_mb: event.target.value ? Number(event.target.value) : null,
                  })
                }
                type="number"
                min={0}
                placeholder="MB"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setQualities((rows) => rows.filter((_, i) => i !== index))}
                className="rounded-xl border border-alien-red/35 px-3 text-xs font-bold text-alien-red transition-colors hover:bg-alien-red/10"
              >
                Remove
              </button>
            </div>
          ))}

          {qualities.length === 0 ? (
            <p className="rounded-xl border border-dashed border-void-500 px-4 py-6 text-center text-xs text-void-200">
              No links yet. Use “+ Add link” to add one.
            </p>
          ) : null}
        </div>

        <p className="mt-4 text-[0.68rem] leading-relaxed text-void-300">
          Tip: add a YouTube link and the release page will embed it automatically as a player.
        </p>
      </section>

      {/* ---------------------------------------------------- actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-linear-to-r from-omni-300 via-omni-400 to-omni-600 px-7 py-3.5 font-display text-xs font-black tracking-[0.2em] text-void-950 uppercase shadow-omni transition-transform hover:scale-[1.02] disabled:opacity-70"
        >
          {pending ? "Saving…" : release ? "Save changes" : "Publish release"}
        </button>
        <Link
          href="/admin/releases"
          className="rounded-full border border-void-500 px-6 py-3.5 font-display text-xs font-black tracking-[0.2em] text-void-100 uppercase transition-colors hover:border-omni-400/50 hover:text-omni-300"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
