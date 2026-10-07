import type { Metadata } from "next";

import { SubmitButton } from "@/components/admin/ConfirmSubmit";
import LogoUploadForm from "@/components/admin/LogoUploadForm";
import Reveal from "@/components/Reveal";
import { saveSettingsAction } from "@/lib/actions";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "වෙබ් අඩවි සැකසුම්",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const inputClass =
  "w-full rounded-xl border border-void-500 bg-void-950/80 px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-void-400 focus:border-omni-400/70";

interface FieldSpec {
  key: string;
  label: string;
  type?: "text" | "textarea" | "url" | "email" | "date";
  placeholder?: string;
  hint?: string;
}

const GROUPS: { title: string; description: string; fields: FieldSpec[] }[] = [
  {
    title: "වෙබ් අඩවි අනන්‍යතාව",
    description: "නම, ලාංඡනය සහ පැතිකඩ — මුල් පිටුවේ සහ ශීර්ෂකයේ පෙනෙන තොරතුරු.",
    fields: [
      { key: "site_name", label: "වෙබ් අඩවියේ නම", placeholder: "Ben 10 SL" },
      { key: "site_tagline", label: "උපවාක්‍යය", placeholder: "සිංහල හඬකැවීම" },
      { key: "logo_text", label: "ලාංඡන පෙළ", placeholder: "Ben 10 SL" },
      {
        key: "logo_url",
        label: "ලාංඡන රූප සබැඳිය",
        hint: "උඩුගත කළ රූපයේ සබැඳිය හෝ /logo.svg",
        placeholder: "https://i.ibb.co/99p93Zfc/file-66.jpg",
      },
      {
        key: "site_description",
        label: "විස්තරය",
        type: "textarea",
        hint: "SEO සහ footer සඳහා",
      },
    ],
  },
  {
    title: "මුල් පිටුවේ වීර දර්ශනය",
    description: "Hero කොටසේ පෙළ සහ පසුබිම් රූපය.",
    fields: [
      { key: "hero_kicker", label: "කුඩා පෙළ (kicker)" },
      { key: "hero_title", label: "ප්‍රධාන මාතෘකාව" },
      { key: "hero_subtitle", label: "උප මාතෘකාව", type: "textarea" },
      { key: "hero_image", label: "පසුබිම් රූපය", placeholder: "/art/hero-alien-tech.jpg" },
      { key: "announcement", label: "ප්‍රකාශන පටිය", hint: "ශීර්ෂකයේ චලනය වන පෙළ" },
      {
        key: "featured_youtube",
        label: "විශේෂ වීඩියෝව (YouTube)",
        type: "url",
        hint: "සිංහල හඬකැවූ වීඩියෝවක් පමණක්",
      },
    ],
  },
  {
    title: "සම්බන්ධතා",
    description: "ටෙලිග්‍රෑම් සහ අනෙකුත් සම්බන්ධතා.",
    fields: [
      { key: "telegram_url", label: "ටෙලිග්‍රෑම් නාලිකාව", type: "url" },
      { key: "telegram_requests", label: "ඉල්ලීම් සබැඳිය", type: "url" },
      { key: "telegram_members", label: "සාමාජික ගණන (පෙන්වන)", placeholder: "12,400" },
      { key: "contact_email", label: "විද්‍යුත් තැපෑල", type: "email" },
      { key: "site_online_since", label: "ආරම්භක දිනය", type: "date" },
    ],
  },
  {
    title: "පාදම සහ වගකීම්",
    description: "footer සටහන් හා නීතිමය පෙළ.",
    fields: [
      { key: "footer_note", label: "පාදම සටහන", type: "textarea" },
      { key: "disclaimer", label: "වගකීම් ප්‍රතික්ෂේප කිරීම", type: "textarea" },
    ],
  },
];

export default async function AdminSettingsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const settings = getSettings();

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="panel p-6">
          <p className="text-[0.66rem] font-black tracking-[0.3em] text-omni-400 uppercase">
            සැකසුම්
          </p>
          <h1 className="mt-2 font-display text-xl font-black text-white">වෙබ් අඩවි සැකසුම්</h1>
          <p className="mt-1 text-sm text-void-100">
            නම, ලාංඡනය, මුල් පිටුවේ පෙළ, ටෙලිග්‍රෑම් සබැඳි සහ පාදමේ තොරතුරු මෙතැනින් යාවත්කාලීන කරන්න.
          </p>
        </div>
      </Reveal>

      {query.saved ? (
        <p className="rounded-xl border border-omni-400/40 bg-omni-400/10 px-4 py-3 text-xs font-bold text-omni-200">
          {query.uploaded
            ? "ලාංඡනය උඩුගත කර වෙබ් අඩවිය පුරා යාවත්කාලීන කරන ලදි."
            : "සැකසුම් සුරකින ලදි — වෙබ් අඩවිය වහාම යාවත්කාලීන විය."}
        </p>
      ) : null}
      {query.error ? (
        <p className="rounded-xl border border-alien-red/40 bg-alien-red/10 px-4 py-3 text-xs font-bold text-alien-red">
          {query.error === "size"
            ? "ගොනුව ඉතා විශාලයි — උපරිම 3MB."
            : query.error === "type"
              ? "සහාය නොදක්වන ගොනු වර්ගයකි. PNG, JPG, WEBP හෝ SVG භාවිතා කරන්න."
              : "ගොනුවක් තෝරා නැත."}
        </p>
      ) : null}

      <Reveal>
        <section className="panel p-6">
          <h2 className="font-display text-sm font-black tracking-[0.2em] text-omni-300 uppercase">
            ලාංඡනය උඩුගත කරන්න
          </h2>
          <p className="mt-1 mb-5 text-xs text-void-200">
            ඔබට කැමති රූපය (PNG / JPG / WEBP / SVG, උපරිම 3MB) මෙතැනින් උඩුගත කරන්න — ශීර්ෂකය, පාදම සහ
            පරිපාලක පැනලය පුරා වහාම යාවත්කාලීන වේ.
          </p>
          <LogoUploadForm currentUrl={settings.logo_url || "/logo.svg"} />
        </section>
      </Reveal>

      <form action={saveSettingsAction} className="space-y-6">
        {GROUPS.map((group) => (
          <Reveal key={group.title}>
            <section className="panel p-6">
              <h2 className="font-display text-sm font-black tracking-[0.2em] text-omni-300 uppercase">
                {group.title}
              </h2>
              <p className="mt-1 mb-5 text-xs text-void-200">{group.description}</p>

              <div className="grid gap-5 sm:grid-cols-2">
                {group.fields.map((field) => {
                  const value = settings[field.key] ?? "";
                  const wide = field.type === "textarea";
                  return (
                    <label key={field.key} className={wide ? "block sm:col-span-2" : "block"}>
                      <span className="mb-1.5 flex items-baseline justify-between gap-3">
                        <span className="text-[0.66rem] font-black tracking-[0.2em] text-void-100 uppercase">
                          {field.label}
                        </span>
                        {field.hint ? (
                          <span className="text-[0.62rem] text-void-300">{field.hint}</span>
                        ) : null}
                      </span>

                      {field.type === "textarea" ? (
                        <textarea
                          name={`setting__${field.key}`}
                          rows={3}
                          defaultValue={value}
                          placeholder={field.placeholder}
                          className={inputClass}
                        />
                      ) : (
                        <input
                          name={`setting__${field.key}`}
                          type={field.type ?? "text"}
                          defaultValue={value}
                          placeholder={field.placeholder}
                          className={inputClass}
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            </section>
          </Reveal>
        ))}

        <div className="sticky bottom-4 z-10">
          <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-xs text-void-100">
              වෙනස්කම් සුරැකීමෙන් පසු වෙබ් අඩවියේ සියලු පිටු යාවත්කාලීන වේ.
            </p>
            <SubmitButton className="rounded-full bg-linear-to-r from-omni-300 via-omni-400 to-omni-600 px-7 py-3 font-display text-xs font-black tracking-[0.2em] text-void-950 uppercase shadow-omni">
              සියලු සැකසුම් සුරකින්න
            </SubmitButton>
          </div>
        </div>
      </form>
    </div>
  );
}
