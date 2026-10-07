"use server";

import fs from "node:fs";
import path from "node:path";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { NOW_SQL, execute, isUniqueViolation, queryOne, transaction } from "./db";
import { incrementViews } from "./queries";
import { updateSettings } from "./settings";
import { slugify } from "./utils";
import type { EpisodeType, QualityInput, ReleaseStatus } from "./types";
import {
  SESSION_COOKIE,
  createSessionToken,
  isAdmin,
  sessionCookieOptions,
  verifyCredentials,
} from "./admin-auth";

export interface ActionState {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}

async function requireAdmin() {
  const allowed = await isAdmin();
  if (!allowed) redirect("/admin/login?error=auth");
}

function str(form: FormData, key: string, fallback = ""): string {
  const value = form.get(key);
  if (value === null) return fallback;
  return String(value).trim();
}

function int(form: FormData, key: string, fallback = 0): number {
  const raw = str(form, key);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nullableInt(form: FormData, key: string): number | null {
  const raw = str(form, key);
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function flag(form: FormData, key: string): boolean {
  const value = form.get(key);
  return value === "on" || value === "true" || value === "1";
}

function parseQualities(form: FormData): QualityInput[] {
  const raw = str(form, "qualities_json");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item: Record<string, unknown>) => ({
        label: String(item.label ?? "").trim(),
        url: String(item.url ?? "").trim(),
        file_size_mb:
          item.file_size_mb === null || item.file_size_mb === undefined || item.file_size_mb === ""
            ? null
            : Number(item.file_size_mb),
      }))
      .filter((item) => item.url.length > 0);
  } catch {
    return [];
  }
}

async function uniqueSlug(base: string, ignoreId?: number): Promise<string> {
  const clean = slugify(base);
  let candidate = clean;
  let counter = 1;
  for (;;) {
    const row = await queryOne<{ id: number }>(
      "SELECT id FROM releases WHERE slug = $1 AND id <> $2",
      [candidate, ignoreId ?? -1],
    );
    if (!row) return candidate;
    counter += 1;
    candidate = `${clean}-${counter}`;
  }
}

/** Keeps the human-readable release code unique (avoids UNIQUE constraint failures). */
async function uniqueCode(base: string, ignoreId?: number): Promise<string> {
  const trimmed = base.trim();
  if (!trimmed) return "";
  let candidate = trimmed;
  let counter = 1;
  for (;;) {
    const row = await queryOne<{ id: number }>(
      "SELECT id FROM releases WHERE code = $1 AND id <> $2",
      [candidate, ignoreId ?? -1],
    );
    if (!row) return candidate;
    counter += 1;
    candidate = `${trimmed}-${counter}`;
  }
}

/* ------------------------------------------------------------------ */
/* Authentication                                                      */
/* ------------------------------------------------------------------ */

export async function signInAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const username = str(form, "username");
  const password = String(form.get("password") ?? "");

  if (!username || !password) {
    return { ok: false, message: "Username and password are required." };
  }
  if (!verifyCredentials(username, password)) {
    return { ok: false, message: "Incorrect username or password." };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions);
  return { ok: true, message: "Signed in successfully." };
}

export async function signOutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/admin/login");
}

/* ------------------------------------------------------------------ */
/* Releases                                                            */
/* ------------------------------------------------------------------ */

interface ReleasePayload {
  category_id: number;
  code: string;
  title: string;
  subtitle: string;
  slug: string;
  season: number;
  episode_number: number | null;
  episode_type: EpisodeType;
  synopsis: string;
  thumbnail: string;
  quality: string;
  duration_minutes: number;
  dubbed_studio: string;
  dubbed_date: string;
  aired_date: string;
  telegram_url: string;
  source: string;
  tags: string;
  featured: number;
  status: ReleaseStatus;
}

/**
 * The release, its link cleanup and its link inserts travel as one transaction.
 * Link rows are matched through the (unique) slug, which lets the whole save run
 * as a single non-interactive Postgres transaction — no id round trip needed.
 */
function releaseStatement(payload: ReleasePayload, id: number) {
  const values = [
    payload.category_id,
    payload.code,
    payload.title,
    payload.subtitle,
    payload.slug,
    payload.season,
    payload.episode_number,
    payload.episode_type,
    payload.synopsis,
    payload.thumbnail,
    payload.quality,
    payload.duration_minutes,
    payload.dubbed_studio,
    payload.dubbed_date,
    payload.aired_date,
    payload.telegram_url,
    payload.source,
    payload.tags,
    payload.featured,
    payload.status,
  ];

  const save =
    id > 0
      ? {
          text: `UPDATE releases SET
                   category_id = $1, code = $2, title = $3, subtitle = $4, slug = $5,
                   season = $6, episode_number = $7, episode_type = $8, synopsis = $9,
                   thumbnail = $10, quality = $11, duration_minutes = $12, dubbed_studio = $13,
                   dubbed_date = $14, aired_date = $15, telegram_url = $16, source = $17,
                   tags = $18, featured = $19, status = $20, updated_at = ${NOW_SQL}
                 WHERE id = $21`,
          params: [...values, id],
        }
      : {
          text: `INSERT INTO releases (
                   category_id, code, title, subtitle, slug, season, episode_number, episode_type,
                   synopsis, thumbnail, quality, duration_minutes, dubbed_studio, dubbed_date,
                   aired_date, telegram_url, source, language, tags, featured, status
                 ) VALUES (
                   $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                   $15, $16, $17, 'sinhala', $18, $19, $20
                 )`,
          params: values,
        };

  return save;
}

export async function saveReleaseAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();

  const id = int(form, "id", 0);
  const title = str(form, "title");
  const categoryId = int(form, "category_id", 0);

  const fieldErrors: Record<string, string> = {};
  if (!title) fieldErrors.title = "A title is required.";
  if (!categoryId) fieldErrors.category_id = "Choose a collection.";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Please fill in the required fields.", fieldErrors };
  }

  const qualities = parseQualities(form);
  const requestedSlug = str(form, "slug") || title;
  const requestedCode =
    str(form, "code") || `B10-${Date.now().toString(36).toUpperCase().slice(-5)}`;

  let slug = "";

  // a concurrent save can steal a slug or code between the check and the write,
  // so the unique violation is retried with a suffix instead of failing the form
  for (let attempt = 0; ; attempt += 1) {
    const suffix = attempt === 0 ? "" : `-${Math.random().toString(36).slice(2, 6)}`;
    slug = await uniqueSlug(requestedSlug + suffix, id || undefined);

    const payload: ReleasePayload = {
      category_id: categoryId,
      code: await uniqueCode(requestedCode + suffix, id || undefined),
      title,
      subtitle: str(form, "subtitle"),
      slug,
      season: int(form, "season", 1),
      episode_number: nullableInt(form, "episode_number"),
      episode_type: (str(form, "episode_type", "episode") as EpisodeType) || "episode",
      synopsis: str(form, "synopsis"),
      thumbnail: str(form, "thumbnail"),
      quality: str(form, "quality", "720p"),
      duration_minutes: int(form, "duration_minutes", 22),
      dubbed_studio: str(form, "dubbed_studio"),
      dubbed_date: str(form, "dubbed_date"),
      aired_date: str(form, "aired_date"),
      telegram_url: str(form, "telegram_url"),
      source: str(form, "source"),
      tags: str(form, "tags"),
      featured: flag(form, "featured") ? 1 : 0,
      status: (str(form, "status", "published") as ReleaseStatus) || "published",
    };

    const save = releaseStatement(payload, id);

    const statements = [
      save,
      {
        text: "DELETE FROM qualities WHERE release_id = (SELECT id FROM releases WHERE slug = $1)",
        params: [slug],
      },
      ...qualities.map((quality, index) => ({
        text: `INSERT INTO qualities (release_id, label, url, file_size_mb, position)
               SELECT r.id, $2, $3, $4, $5 FROM releases r WHERE r.slug = $1`,
        params: [
          slug,
          quality.label || `Link ${index + 1}`,
          quality.url,
          quality.file_size_mb,
          index,
        ],
      })),
    ];

    try {
      await transaction(statements);
      break;
    } catch (error) {
      if (isUniqueViolation(error) && attempt < 3) continue;
      throw error;
    }
  }

  revalidatePath("/");
  revalidatePath("/releases");
  revalidatePath("/admin");
  revalidatePath("/admin/releases");
  revalidatePath("/category", "layout");
  revalidatePath(`/release/${slug}`);
  redirect("/admin/releases?saved=1");
}

export async function deleteReleaseAction(form: FormData): Promise<void> {
  await requireAdmin();
  const id = int(form, "id", 0);
  if (id > 0) {
    // quality links disappear through ON DELETE CASCADE
    await execute("DELETE FROM releases WHERE id = $1", [id]);
  }
  revalidatePath("/admin/releases");
  revalidatePath("/releases");
  revalidatePath("/");
  redirect("/admin/releases?deleted=1");
}

export async function toggleReleaseStatusAction(form: FormData): Promise<void> {
  await requireAdmin();
  const id = int(form, "id", 0);
  if (id > 0) {
    await execute(
      `UPDATE releases
       SET status = CASE WHEN status = 'published' THEN 'draft' ELSE 'published' END,
           updated_at = ${NOW_SQL}
       WHERE id = $1`,
      [id],
    );
  }
  revalidatePath("/admin/releases");
  revalidatePath("/releases");
  revalidatePath("/");
}

export async function toggleFeaturedAction(form: FormData): Promise<void> {
  await requireAdmin();
  const id = int(form, "id", 0);
  if (id > 0) {
    await execute("UPDATE releases SET featured = CASE WHEN featured = 1 THEN 0 ELSE 1 END WHERE id = $1", [
      id,
    ]);
  }
  revalidatePath("/admin/releases");
  revalidatePath("/");
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export async function saveCategoryAction(form: FormData): Promise<void> {
  await requireAdmin();
  const id = int(form, "id", 0);
  const name = str(form, "name");
  const nameAlt = str(form, "name_alt");
  const description = str(form, "description");
  const accent = str(form, "accent", "#39FF14") || "#39FF14";
  const sortOrder = int(form, "sort_order", 0);
  const slug = slugify(str(form, "slug") || name);

  if (!name) redirect("/admin/categories?error=name");

  try {
    if (id > 0) {
      await execute(
        `UPDATE categories
         SET name = $1, name_alt = $2, slug = $3, description = $4, accent = $5, sort_order = $6
         WHERE id = $7`,
        [name, nameAlt, slug, description, accent, sortOrder, id],
      );
    } else {
      await execute(
        `INSERT INTO categories (name, name_alt, slug, description, accent, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [name, nameAlt, slug, description, accent, sortOrder],
      );
    }
  } catch (error) {
    if (isUniqueViolation(error)) redirect("/admin/categories?error=slug");
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/releases");
  revalidatePath("/admin/categories");
  redirect("/admin/categories?saved=1");
}

export async function deleteCategoryAction(form: FormData): Promise<void> {
  await requireAdmin();
  const id = int(form, "id", 0);
  const used = await queryOne<{ c: number }>(
    "SELECT COUNT(*)::int AS c FROM releases WHERE category_id = $1",
    [id],
  );
  if ((used?.c ?? 0) > 0) {
    redirect("/admin/categories?error=inuse");
  }
  await execute("DELETE FROM categories WHERE id = $1", [id]);
  revalidatePath("/admin/categories");
  revalidatePath("/");
  redirect("/admin/categories?deleted=1");
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export async function saveSettingsAction(form: FormData): Promise<void> {
  await requireAdmin();
  const patch: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (key.startsWith("setting__")) {
      patch[key.replace("setting__", "")] = String(value);
    }
  }
  await updateSettings(patch);
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}

/**
 * Uploads the site logo straight from the admin panel.
 * Accepts png / jpg / webp / svg up to 3 MB. On a normal server the file lands
 * in /public/uploads; on a read-only host (Vercel) it is stored in the database
 * as a data URL instead, which is why that path is limited to 1.5 MB.
 */
export async function uploadLogoAction(form: FormData): Promise<void> {
  await requireAdmin();

  const file = form.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/settings?error=nofile");
  }

  const allowed: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/svg+xml": "svg",
  };
  const extension = allowed[file.type];
  if (!extension) redirect("/admin/settings?error=type");
  if (file.size > 3 * 1024 * 1024) redirect("/admin/settings?error=size");

  const buffer = Buffer.from(await file.arrayBuffer());
  let logoUrl: string;

  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });
    const fileName = `logo-${Date.now()}.${extension}`;
    fs.writeFileSync(path.join(uploadDir, fileName), buffer);
    logoUrl = `/uploads/${fileName}`;
  } catch {
    if (file.size > 1_500_000) redirect("/admin/settings?error=size");
    logoUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
  }

  await updateSettings({ logo_url: logoUrl });

  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1&uploaded=1");
}

/* ------------------------------------------------------------------ */
/* Public helpers                                                      */
/* ------------------------------------------------------------------ */

export async function registerViewAction(id: number): Promise<void> {
  if (!Number.isFinite(id) || id <= 0) return;
  await incrementViews(id);
}
