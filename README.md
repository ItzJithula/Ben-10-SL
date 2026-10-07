# Ben 10 SL — සිංහල හඬකැවූ Ben 10 නිකුතු පිටුව

A full-stack **TypeScript / Next.js 15** fan site for **Sinhala dubbed Ben 10** episodes, with a
complete **admin dashboard** for publishing releases, organising them into Ben 10 main collections
(Classic, Alien Force, Ultimate Alien, Omniverse, Reboot, Movies & Specials) and editing the site
settings — no code changes needed.

> The site only distributes **Sinhala dubbed** content. Every release is stored as `sinhala`
> and the UI marks it with a “සිංහල හඬකැවීම” badge.

---

## ✨ Features

### Public site
| | |
|---|---|
| **Omnitrix dial** | Interactive SVG/CSS Omnitrix watch in the hero (click it to “activate”) |
| **Hero with watch art** | Generated alien-tech background, animated particles, staggered text reveal |
| **Collections** | Category grid with per-collection accent colours |
| **Release browsing** | `/releases` with live search, collection chips, type filter, sorting, pagination |
| **Release detail** | Embedded player (YouTube links auto-embed), quality/download links with file sizes, dub studio + dates, tags, prev/next episode, related releases, view counter |
| **Movies & specials** | Dedicated `/movies` archive |
| **Smooth scroll animations** | [Lenis](https://github.com/darkroomengineering/lenis) inertial scrolling + Framer Motion scroll reveals, page fades, hover glow, marquee ticker, scroll energy bar |
| **Ben 10 elements** | Omnitrix watch frames, hourglass mark, hex-grid overlays, scanlines, alien roster strip, green/black Omnitrix palette |
| **Sinhala first** | Sinhala UI copy, Noto Sans Sinhala font, Sinhala dates, lang="si" |
| **SEO ready** | Dynamic metadata, OpenGraph, `sitemap.xml`, `robots.txt` (admin disallowed) |

### Admin dashboard (`/admin`)
- **Login** with signed, http-only session cookie (HMAC-SHA256, timing-safe compare)
- **Dashboard** — release/published/draft/movie counts, download-link count, total views, per-collection bars, latest releases
- **Releases** — sortable table, search + filters, one-click publish ⇄ draft toggle, ★ featured toggle, delete with confirm
- **Release editor** — 4-step form: basics (collection, code, titles, slug, season/episode, type, quality, duration, status, featured), content (synopsis, thumbnail, tags, source), dub info (studio, dub date, original air date), and unlimited download links (label / URL / size, drag-free add & remove)
- **Collections** — create, edit (name, Sinhala name, slug, colour, description, order) and delete
- **Settings** — site name, tagline, logo URL, logo **upload**, hero texts & image, announcement ticker, Telegram links, member count, contact, footer, disclaimer
- Public site updates instantly after every save (no rebuild)

---

## 🚀 Quick start

```bash
npm install
cp .env.example .env.local     # then change ADMIN_PASSWORD + ADMIN_SESSION_SECRET
npm run dev                    # http://localhost:3000
```

The SQLite database (`data/ben10sl.db`) is **created and seeded automatically** on first run with
6 collections, 22 example Sinhala-dubbed releases, 41 download links and the default settings.

```bash
npm run build && npm start   # production
npm run lint                 # type-check (tsc --noEmit)
npm run db:reset             # delete the database (re-seeded on next start)
```

### Admin login

| | |
|---|---|
| URL | `http://localhost:3000/admin` |
| Username | `admin` (or `ADMIN_USERNAME`) |
| Password | `ben10admin` (or `ADMIN_PASSWORD`) |

> ⚠️ Change `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` in `.env.local` before going online.

---

## 🖼️ Logo

The fan-page logo is stored in settings (`logo_url`) and is used in the header, footer and admin
panel. Three ways to set it:

1. **Upload** — Admin → සැකසුම් → *ලාංඡනය උඩුගත කරන්න* (PNG / JPG / WEBP / SVG, ≤ 3 MB) →
   saved to `public/uploads/`.
2. **Paste a URL** — Admin → සැකසුම් → *ලාංඡන රූප සබැඳිය* (e.g. `https://i.ibb.co/99p93Zfc/file-66.jpg`).
3. **Replace the file** — drop your artwork at `public/logo.svg` (or `.png`) and set that path.

The default is the hosted fan logo (`https://i.ibb.co/99p93Zfc/file-66.jpg`); if that image can't be
loaded the header automatically falls back to the built-in neon mark in `public/logo.svg`, so the
site never shows a broken logo.

---

## 🗂️ Collections

Seeded collections (rename/recolour them any time from the admin panel):

| Slug | Name | Sinhala | Accent |
|---|---|---|---|
| `classic` | Ben 10 Classic | බෙන් 10 ක්ලැසික් | `#39FF14` |
| `alien-force` | Alien Force | එලියන් ෆෝස් | `#00E5FF` |
| `ultimate-alien` | Ultimate Alien | අල්ටිමේට් එලියන් | `#FF7A00` |
| `omniverse` | Omniverse | ඕම්නිවර්ස් | `#B026FF` |
| `reboot` | Reboot | රීබූට් | `#FFC400` |
| `movies-specials` | Movies & Specials | චිත්‍රපට හා විශේෂ | `#FF2E88` |

Add as many more as you like — a new collection shows up in the navigation menu instantly.

---

## 🧱 Tech stack

- **Next.js 15** (App Router, server components, server actions) + **React 19**
- **TypeScript** (strict) — no `any` in app code
- **Tailwind CSS v4** design tokens (`src/app/globals.css`) with an Omnitrix palette + collection accents
- **Framer Motion** scroll reveals & micro-interactions, **Lenis** smooth scrolling
- **better-sqlite3** — local, zero-config database (`data/ben10sl.db`, WAL mode, gitignored)
- **Fontsource** — Orbitron (display), Rajdhani (Latin body), Noto Sans Sinhala (Sinhala body)
- Zero runtime cost for the Omnitrix: pure SVG + CSS keyframes

---

## 📁 Project structure

```
src/
├── app/
│   ├── layout.tsx                 # shell: header, footer, Lenis, page fade, metadata
│   ├── page.tsx                   # home (hero, collections, featured, latest, rails, aliens, CTA)
│   ├── releases/page.tsx          # browse + filters + pagination
│   ├── release/[slug]/page.tsx    # release detail (player, links, details, related)
│   ├── category/[slug]/page.tsx   # collection archive
│   ├── movies/page.tsx            # movies & specials
│   ├── about/  how-to-download/   # info pages
│   ├── admin/
│   │   ├── login/page.tsx
│   │   └── (dashboard)/           # auth-guarded: dashboard, releases, categories, settings
│   ├── robots.ts  sitemap.ts  not-found.tsx  globals.css  icon.svg
├── components/                    # OmnitrixWatch, SiteHeader, ReleaseCard, PlayerCard, Reveal, …
│   └── admin/                     # AdminNav, ReleaseForm, LogoUploadForm, ConfirmSubmit, …
└── lib/
    ├── db.ts            # schema + automatic seed
    ├── queries.ts       # all read queries (filters, stats, related)
    ├── actions.ts       # server actions (save/delete/toggle/settings/upload/login)
    ├── admin-auth.ts    # session cookie + credential check
    ├── settings.ts      # key/value settings store
    ├── types.ts  utils.ts  server-paths.ts
public/
├── logo.svg  art/*.jpg  uploads/
```

---

## 🎨 Theming

Everything visual lives in `src/app/globals.css` under `@theme`:

```css
--color-omni-400: #39ff14;   /* Omnitrix green (primary)   */
--color-void-900: #060a09;   /* alien black (background)    */
--color-alien-cyan: #00e5ff; /* collection accents …        */
--font-display: "Orbitron Variable", …;
--animate-omni-spin / --animate-pulse-ring / --animate-float / …
```

Change a token once and the whole site (cards, buttons, glows, watch dial) follows.

---

## 🌐 Deployment

1. Push this repo to GitHub and import it on Vercel (or any Node host).
2. Add environment variables: `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `SITE_URL`.
3. **Database:** SQLite lives on the local filesystem. On serverless platforms (Vercel) the
   filesystem is not persistent — either
   - run it on a VPS / Docker / Railway / Fly.io with a mounted volume (`DATA_DIR=/data`), or
   - swap `src/lib/db.ts` for a hosted database (Turso/libSQL, Postgres…), or
   - use `data/` persistence provided by your host.
4. Uploaded logos (`public/uploads`) are filesystem files as well — on serverless, prefer pasting a
   hosted logo URL instead.

---

## ⚖️ Disclaimer

This is a non-official **fan page**. No video files are hosted here: every download/watch link points
to an external service (e.g. Telegram). All characters, artwork and series titles belong to their
respective owners (Cartoon Network / Warner Bros. Discovery). If you are a rights holder and want
content removed, contact the address configured in the site settings.
