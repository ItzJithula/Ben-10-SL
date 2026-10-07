import type { Metadata } from "next";

import { SubmitButton } from "@/components/admin/ConfirmSubmit";
import LogoUploadForm from "@/components/admin/LogoUploadForm";
import Reveal from "@/components/Reveal";
import { saveSettingsAction } from "@/lib/actions";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Site settings",
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
    title: "Site identity",
    description: "Name, logo and tagline — what visitors see in the header and footer.",
    fields: [
      { key: "site_name", label: "Site name", placeholder: "Ben 10 SL" },
      { key: "site_tagline", label: "Tagline", placeholder: "Sinhala Dubbed Episodes" },
      { key: "logo_text", label: "Logo text", placeholder: "Ben 10 SL" },
      {
        key: "logo_url",
        label: "Logo image URL",
        hint: "an uploaded file path or /logo.svg",
        placeholder: "https://i.ibb.co/99p93Zfc/file-66.jpg",
      },
      {
        key: "site_description",
        label: "Site description",
        type: "textarea",
        hint: "used for SEO and the footer",
      },
    ],
  },
  {
    title: "Home page hero",
    description: "The text and background image of the hero section.",
    fields: [
      { key: "hero_kicker", label: "Kicker (small label)" },
      { key: "hero_title", label: "Headline" },
      { key: "hero_subtitle", label: "Sub headline", type: "textarea" },
      { key: "hero_image", label: "Background image", placeholder: "/art/hero-alien-tech.jpg" },
      { key: "announcement", label: "Announcement ticker", hint: "scrolling text in the header" },
      {
        key: "featured_youtube",
        label: "Featured video (YouTube)",
        type: "url",
        hint: "a Sinhala dubbed video only",
      },
    ],
  },
  {
    title: "Contact",
    description: "Telegram links and other ways to get in touch.",
    fields: [
      { key: "telegram_url", label: "Telegram channel", type: "url" },
      { key: "telegram_requests", label: "Episode requests link", type: "url" },
      { key: "telegram_members", label: "Member count (displayed)", placeholder: "12,400" },
      { key: "contact_email", label: "Contact email", type: "email" },
      { key: "site_online_since", label: "Online since", type: "date" },
    ],
  },
  {
    title: "Footer & legal",
    description: "Footer notes and the legal text shown at the bottom of the site.",
    fields: [
      { key: "footer_note", label: "Footer note", type: "textarea" },
      { key: "disclaimer", label: "Disclaimer", type: "textarea" },
    ],
  },
];

export default async function AdminSettingsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="panel p-6">
          <p className="text-[0.66rem] font-black tracking-[0.3em] text-omni-400 uppercase">
            Settings
          </p>
          <h1 className="mt-2 font-display text-xl font-black text-white">Site settings</h1>
          <p className="mt-1 text-sm text-void-100">
            Update the name, logo, home page copy, Telegram links and footer information from here.
          </p>
        </div>
      </Reveal>

      {query.saved ? (
        <p className="rounded-xl border border-omni-400/40 bg-omni-400/10 px-4 py-3 text-xs font-bold text-omni-200">
          {query.uploaded
            ? "Logo uploaded — it is now live across the whole site."
            : "Settings saved — the site updated immediately."}
        </p>
      ) : null}
      {query.error ? (
        <p className="rounded-xl border border-alien-red/40 bg-alien-red/10 px-4 py-3 text-xs font-bold text-alien-red">
          {query.error === "size"
            ? "That file is too large — 3MB maximum (1.5MB when the logo has to be stored in the database)."
            : query.error === "type"
              ? "Unsupported file type. Use PNG, JPG, WEBP or SVG."
              : "No file was selected."}
        </p>
      ) : null}

      <Reveal>
        <section className="panel p-6">
          <h2 className="font-display text-sm font-black tracking-[0.2em] text-omni-300 uppercase">
            Upload a logo
          </h2>
          <p className="mt-1 mb-5 text-xs text-void-200">
            Upload your own artwork (PNG / JPG / WEBP / SVG, 3MB maximum). It replaces the logo in the
            header, the footer and the admin panel straight away. On a read-only host such as Vercel the
            file is stored in the database instead of the filesystem, which caps it at 1.5MB — for bigger
            artwork paste a hosted image URL into the Logo field below.
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
              Saving updates every page of the site.
            </p>
            <SubmitButton className="rounded-full bg-linear-to-r from-omni-300 via-omni-400 to-omni-600 px-7 py-3 font-display text-xs font-black tracking-[0.2em] text-void-950 uppercase shadow-omni">
              Save all settings
            </SubmitButton>
          </div>
        </div>
      </form>
    </div>
  );
}
