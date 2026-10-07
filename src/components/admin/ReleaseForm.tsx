"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { saveReleaseAction, type ActionState } from "@/lib/actions";
import { cx, slugify } from "@/lib/utils";
import type { CategoryWithCount, QualityInput, ReleaseDetail } from "@/lib/types";

const INITIAL: ActionState = { ok: false, message: "" };

const TYPES = [
  { value: "episode", label: "කථාංගය" },
  { value: "movie", label: "චිත්‍රපටය" },
  { value: "special", label: "විශේෂ වැඩසටහන" },
  { value: "short", label: "කෙටි වැඩසටහන" },
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

  const [slug, setSlug] = useState(release?.slug ?? "");
  const [titleEn, setTitleEn] = useState(release?.title_en ?? "");
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
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="language" value="sinhala" />

      {state.message && !state.ok ? (
        <p className="rounded-xl border border-alien-red/40 bg-alien-red/10 px-4 py-3 text-xs font-bold text-alien-red">
          {state.message}
        </p>
      ) : null}

      {/* ---------------------------------------------------- basics */}
      <section className="panel p-6">
        <h2 className="mb-5 font-display text-sm font-black tracking-[0.2em] text-omni-300 uppercase">
          1 · මූලික තොරතුරු
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="මාලාව / ප්‍රවර්ගය" error={state.fieldErrors?.category_id}>
            <select
              name="category_id"
              defaultValue={release?.category_id ?? categories[0]?.id ?? 0}
              className={inputClass}
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name_si || category.name} ({category.name})
                </option>
              ))}
            </select>
          </Field>

          <Field label="නිකුත් කේතය" hint="උදා: B10-CL-007">
            <input name="code" defaultValue={release?.code ?? ""} className={inputClass} placeholder="B10-CL-007" />
          </Field>

          <Field label="සිංහල නම" error={state.fieldErrors?.title}>
            <input
              name="title"
              defaultValue={release?.title ?? ""}
              className={inputClass}
              placeholder="කථාංගයේ සිංහල නම"
              required
            />
          </Field>

          <Field label="මුල් නම (ඉංග්‍රීසි)" hint="slug ස්වයංක්‍රීයව සෑදේ">
            <input
              name="title_en"
              value={titleEn}
              onChange={(event) => {
                setTitleEn(event.target.value);
                setSlug(slugify(event.target.value));
              }}
              className={inputClass}
              placeholder="And Then There Were 10"
            />
          </Field>

          <Field label="URL slug" hint="වෙබ් ලිපිනයේ පෙනෙන කොටස">
            <input
              value={slug}
              onChange={(event) => setSlug(slugify(event.target.value))}
              className={inputClass}
              placeholder="and-then-there-were-10"
            />
          </Field>

          <Field label="වර්ගය">
            <select name="episode_type" defaultValue={release?.episode_type ?? "episode"} className={inputClass}>
              {TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-5">
            <Field label="වාරය">
              <input
                name="season"
                type="number"
                min={0}
                defaultValue={release?.season ?? 1}
                className={inputClass}
              />
            </Field>
            <Field label="කථාංග අංකය">
              <input
                name="episode_number"
                type="number"
                min={0}
                defaultValue={release?.episode_number ?? ""}
                className={inputClass}
                placeholder="1"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Field label="ගුණත්වය">
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
            <Field label="කාලය (මිනිත්තු)">
              <input
                name="duration_minutes"
                type="number"
                min={1}
                defaultValue={release?.duration_minutes ?? 22}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="තත්ත්වය">
            <select name="status" defaultValue={release?.status ?? "published"} className={inputClass}>
              <option value="published">ප්‍රකාශිත</option>
              <option value="draft">කෙටුම්පත</option>
            </select>
          </Field>

          <label className="flex items-center gap-3 rounded-xl border border-void-500 bg-void-950/60 px-4 py-3">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={release?.featured === 1}
              className="h-4 w-4 accent-[#39ff14]"
            />
            <span className="text-sm font-bold text-void-50">මුල් පිටුවේ විශේෂ නිකුතුව ලෙස පෙන්වන්න</span>
          </label>
        </div>
      </section>

      {/* ---------------------------------------------------- content */}
      <section className="panel p-6">
        <h2 className="mb-5 font-display text-sm font-black tracking-[0.2em] text-omni-300 uppercase">
          2 · විස්තර හා මාධ්‍ය
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="කථා සාරාංශය (සිංහල)" className="sm:col-span-2">
            <textarea
              name="synopsis"
              defaultValue={release?.synopsis ?? ""}
              rows={5}
              className={cx(inputClass, "resize-y leading-relaxed")}
              placeholder="කථාංගයේ කෙටි විස්තරය…"
            />
          </Field>

          <Field label="පින්තූර සබැඳිය (thumbnail)" hint="https://… හෝ /art/…">
            <input
              name="thumbnail"
              defaultValue={release?.thumbnail ?? ""}
              className={inputClass}
              placeholder="https://i.ibb.co/…jpg"
            />
          </Field>

          <Field label="ටැග්" hint="කොමාවෙන් වෙන් කරන්න">
            <input
              name="tags"
              defaultValue={release?.tags ?? ""}
              className={inputClass}
              placeholder="සටන්,එලියන්,විශේෂ"
            />
          </Field>

          <Field label="මූලාශ්‍රය">
            <input
              name="source"
              defaultValue={release?.source ?? ""}
              className={inputClass}
              placeholder="Cartoon Network (සිංහල හඬකැවීම)"
            />
          </Field>

          <Field label="ටෙලිග්‍රෑම් සබැඳිය">
            <input
              name="telegram_url"
              defaultValue={release?.telegram_url ?? ""}
              className={inputClass}
              placeholder="https://t.me/…"
            />
          </Field>
        </div>
      </section>

      {/* ---------------------------------------------------- dub info */}
      <section className="panel p-6">
        <h2 className="mb-5 font-display text-sm font-black tracking-[0.2em] text-omni-300 uppercase">
          3 · හඬකැවීමේ තොරතුරු
        </h2>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="හඬකැවීමේ ස්ටුඩියෝව">
            <input
              name="dubbed_studio"
              defaultValue={release?.dubbed_studio ?? "SL Dubbing Team"}
              className={inputClass}
            />
          </Field>
          <Field label="හඬකැවූ දිනය">
            <input
              name="dubbed_date"
              type="date"
              defaultValue={release?.dubbed_date ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="මුල් විකාශන දිනය">
            <input
              name="aired_date"
              type="date"
              defaultValue={release?.aired_date ?? ""}
              className={inputClass}
            />
          </Field>

          <div className="sm:col-span-3 flex items-center gap-3 rounded-xl border border-omni-400/30 bg-omni-400/8 px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-omni-400/20 text-omni-300">
              ✓
            </span>
            <p className="text-xs leading-relaxed text-void-100">
              මෙම වෙබ් අඩවියේ සියලුම නිකුතු <strong className="text-omni-300">සිංහල හඬකැවීම</strong> ලෙසම
              සුරැකේ — වෙනත් භාෂාවක් තෝරාගත නොහැක.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- links */}
      <section className="panel p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="font-display text-sm font-black tracking-[0.2em] text-omni-300 uppercase">
            4 · බාගැනීමේ සබැඳි
          </h2>
          <button
            type="button"
            onClick={() =>
              setQualities((rows) => [...rows, { label: "720p", url: "", file_size_mb: null }])
            }
            className="rounded-full border border-omni-400/40 px-4 py-2 text-xs font-black tracking-wider text-omni-300 uppercase transition-colors hover:bg-omni-400/10"
          >
            + සබැඳියක්
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
                placeholder="https://t.me/… හෝ YouTube සබැඳිය"
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
                ඉවත් කරන්න
              </button>
            </div>
          ))}

          {qualities.length === 0 ? (
            <p className="rounded-xl border border-dashed border-void-500 px-4 py-6 text-center text-xs text-void-200">
              සබැඳි නොමැත. “+ සබැඳියක්” ඔබා එක් කරන්න.
            </p>
          ) : null}
        </div>

        <p className="mt-4 text-[0.68rem] leading-relaxed text-void-300">
          ඉඟිය: YouTube සබැඳියක් එක් කළහොත්, නිකුතු පිටුවේ එය ස්වයංක්‍රීයව ගොනු නොකළ වීඩියෝ ධාවකයක් ලෙස පෙන්වයි.
        </p>
      </section>

      {/* ---------------------------------------------------- actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-linear-to-r from-omni-300 via-omni-400 to-omni-600 px-7 py-3.5 font-display text-xs font-black tracking-[0.2em] text-void-950 uppercase shadow-omni transition-transform hover:scale-[1.02] disabled:opacity-70"
        >
          {pending ? "සුරකිමින්…" : release ? "වෙනස්කම් සුරකින්න" : "නිකුතුව ප්‍රකාශ කරන්න"}
        </button>
        <Link
          href="/admin/releases"
          className="rounded-full border border-void-500 px-6 py-3.5 font-display text-xs font-black tracking-[0.2em] text-void-100 uppercase transition-colors hover:border-omni-400/50 hover:text-omni-300"
        >
          අවලංගු කරන්න
        </Link>
      </div>
    </form>
  );
}
