# Ben 10 SL — Sinhala dubbed Ben 10 archive

A full-stack **TypeScript / Next.js 15** fan site for **Ben 10 episodes and movies with Sinhala
audio**, with a complete **admin dashboard** for publishing releases, organising them into Ben 10
main collections (Classic, Alien Force, Ultimate Alien, Omniverse, Reboot, Movies & Specials) and
editing the site settings — all without touching code.

> The whole interface is in **English**. The archive only ever distributes **Sinhala dubbed**
> releases, and each one is badged “Sinhala Dub”.

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
| **English UI** | All copy in English, Latin display fonts, readable dates, `lang="en"` |
| **SEO ready** | Dynamic metadata, OpenGraph, `sitemap.xml`, `robots.txt` (admin disallowed) |

### Admin dashboard (`/admin`)
- **Login** with signed, http-only session cookie (HMAC-SHA256, timing-safe compare)
- **Dashboard** — release/published/draft/movie counts, download-link count, total views, per-collection bars, latest releases
- **Releases** — sortable table, search + filters, one-click publish ⇄ draft toggle, ★ featured toggle, delete with confirm
- **Release editor** — 4-step form: basics (collection, code, title, slug, season/episode, type, quality, runtime, status, featured), content (synopsis, thumbnail, tags, source), dub info (studio, dub date, original air date), and unlimited download links (label / URL / size)
- **Collections** — create, edit (name, alternate name, slug, colour, description, order) and delete
- **Settings** — site name, tagline, logo URL, logo **upload**, hero texts & image, announcement ticker, Telegram links, member count, contact, footer, disclaimer
- The public site updates instantly after every save (no rebuild)

---

## 🚀 Quick start

```bash
npm install
cp .env.example .env.local     # then set ADMIN_PASSWORD + ADMIN_SESSION_SECRET
npm run dev                    # http://localhost:3000
```

The site stores everything in **PostgreSQL on Neon**. Tables are **created and seeded
automatically** on first use — 6 collections, 22 example releases, 41 download links and the default
settings — so a brand-new database needs no manual SQL.

```bash
# with a Neon database (see Deployment below)
DATABASE_URL="postgresql://…" npm run dev

# without DATABASE_URL the app runs on an embedded local PostgreSQL (./data/pglite),
# so you can explore the whole site — admin panel included — with zero setup
npm run dev
```

```bash
npm run build && npm start   # production
npm run lint                 # type-check (tsc --noEmit)
npm run db:check             # connection check: prints table row counts
npm run db:reset             # wipes the LOCAL embedded database only
```

### Admin login

| | |
|---|---|
| URL | `http://localhost:3000/admin` |
| Username | `admin` (or `ADMIN_USERNAME`) |
| Password | the value you put in `ADMIN_PASSWORD` |

Credentials are **never committed** — they live in `.env.local` (gitignored) locally and in your
host's environment variables in production:

```bash
cp .env.example .env.local
# then open .env.local and set a password you will remember, e.g.
#   ADMIN_PASSWORD=my-secret-admin-password
#   ADMIN_SESSION_SECRET=  (optional — openssl rand -hex 32)
```

Behaviour:

- **No `ADMIN_PASSWORD` in production** → the panel stays **locked** (fail closed) and the server
  logs `ADMIN_PASSWORD is not set — the admin panel is locked in production.` The public site keeps
  working normally.
- **No `ADMIN_PASSWORD` in development** → a temporary password is generated for that process and
  printed in the terminal, so you are never locked out and no default credential ever exists.
- **`ADMIN_SESSION_SECRET` unset** → a random per-process key signs the session cookie, so sessions
  simply end whenever the server restarts.
- The login page never renders credentials.

---

## 🖼️ Logo

The logo is stored in settings (`logo_url`) and is used in the header, footer and admin panel.
Three ways to set it:

1. **Upload** — Admin → Settings → *Upload a logo* (PNG / JPG / WEBP / SVG, ≤ 3 MB) → saved to
   `public/uploads/`.
2. **Paste a URL** — Admin → Settings → *Logo image URL*
   (the default is `https://i.ibb.co/99p93Zfc/file-66.jpg`).
3. **Replace the file** — drop your artwork at `public/logo.svg` (or `.png`) and set that path.

If the configured image cannot be loaded, the header falls back to the built-in neon mark in
`public/logo.svg`, so the site never shows a broken logo.

---

## 🗂️ Collections

Seeded collections (rename or recolour them any time from the admin panel):

| Slug | Name | Alternate name | Accent |
|---|---|---|---|
| `classic` | Ben 10 Classic | 2005 Series | `#39FF14` |
| `alien-force` | Alien Force | 2008 Series | `#00E5FF` |
| `ultimate-alien` | Ultimate Alien | 2010 Series | `#FF7A00` |
| `omniverse` | Omniverse | 2012 Series | `#B026FF` |
| `reboot` | Reboot | 2016 Series | `#FFC400` |
| `movies-specials` | Movies & Specials | Feature Length | `#FF2E88` |

Add as many more as you like — a new collection shows up in the navigation menu instantly.

---

## 🧱 Tech stack

- **Next.js 15** (App Router, server components, server actions) + **React 19**
- **TypeScript** (strict) — no `any` in app code
- **Tailwind CSS v4** design tokens (`src/app/globals.css`) with an Omnitrix palette + collection accents
- **Framer Motion** scroll reveals & micro-interactions, **Lenis** smooth scrolling
- **PostgreSQL on [Neon](https://neon.tech)** via `@neondatabase/serverless` (SQL over HTTPS,
  serverless-friendly) — plus **PGlite** as an embedded local Postgres for zero-config development
- **Fontsource** — Orbitron (display) and Rajdhani (body)
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
│   │   └── (dashboard)/           # auth-guarded: dashboard, releases, collections, settings
│   └── robots.ts  sitemap.ts  not-found.tsx  globals.css  icon.svg
├── components/                    # OmnitrixWatch, SiteHeader, ReleaseCard, PlayerCard, Reveal, …
│   └── admin/                     # AdminNav, ReleaseForm, LogoUploadForm, ConfirmSubmit, …
└── lib/
    ├── db.ts            # Postgres/Neon driver, schema, automatic seed
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

## 🌐 Deployment (Vercel + Neon)

### 1. Create the database

1. Sign in at [neon.tech](https://console.neon.tech) and create a project (the free tier is plenty).
2. Open **Connection string** and copy the **pooled** URL — it looks like
   `postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`.

You do **not** need to create tables or run any SQL: the first request creates the schema and seeds
the demo archive automatically. `npm run db:check` verifies the connection from your machine.

### 2. Point Vercel at it

Either attach the database through the Vercel dashboard (**Storage → Neon**, which sets
`DATABASE_URL` for you), or add the variables manually in
**Project → Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `DATABASE_URL` | the pooled Neon connection string (also accepts `POSTGRES_URL`) |
| `ADMIN_PASSWORD` | **required** — without it the admin panel stays locked in production |
| `ADMIN_SESSION_SECRET` | `openssl rand -hex 32` (keeps sessions valid across deployments) |
| `ADMIN_USERNAME` | optional, defaults to `admin` |
| `SITE_URL` | your production URL, used by the sitemap / OpenGraph metadata |

Then deploy (or **Redeploy**, since environment variables are only picked up by a new build).

### 3. Notes for serverless hosts

- **Logo uploads** work: on a read-only filesystem (Vercel) the file is stored in the database as a
  data URL instead of `public/uploads/`, which caps that path at 1.5 MB. For larger artwork paste a
  hosted image URL into Admin → Settings → *Logo image URL*.
- **Views / edits are instant**: every admin save revalidates the affected pages.
- **Local development without Neon** uses the embedded Postgres in `./data/pglite` (gitignored),
  which behaves like the real thing but is single-process only — never use it in production.
- Deployment on a VPS/Docker/Railway/Fly.io works the same way: set `DATABASE_URL` in the env.

---

## ⚖️ Disclaimer

This is a non-official **fan page**. No video files are hosted here: every download/watch link points
to an external service (e.g. Telegram). All characters, artwork and series titles belong to their
respective owners (Cartoon Network / Warner Bros. Discovery). If you are a rights holder and want
content removed, contact the address configured in the site settings.
