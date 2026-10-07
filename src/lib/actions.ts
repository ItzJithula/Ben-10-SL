"use server";

import fs from "node:fs";
import path from "node:path";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { getDb } from "./db";
import { getReleaseById } from "./queries";
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

function uniqueSlug(base: string, ignoreId?: number): string {
  const db = getDb();
  let candidate = slugify(base);
  let counter = 1;
  for (;;) {
    const row = db
      .prepare("SELECT id FROM releases WHERE slug = ? AND id <> ?")
      .get(candidate, ignoreId ?? -1) as { id: number } | undefined;
    if (!row) return candidate;
    counter += 1;
    candidate = `${slugify(base)}-${counter}`;
  }
}

/** Keeps the human-readable release code unique (avoids UNIQUE constraint failures). */
function uniqueCode(base: string, ignoreId?: number): string {
  const db = getDb();
  const trimmed = base.trim();
  if (!trimmed) return "";
  let candidate = trimmed;
  let counter = 1;
  for (;;) {
    const row = db
      .prepare("SELECT id FROM releases WHERE code = ? AND id <> ?")
      .get(candidate, ignoreId ?? -1) as { id: number } | undefined;
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
    return { ok: false, message: "පරිශීලක නාමය සහ මුරපදය අවශ්‍යයි." };
  }
  if (!verifyCredentials(username, password)) {
    return { ok: false, message: "වැරදි පරිශීලක නාමය හෝ මුරපදය." };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions);
  return { ok: true, message: "සාර්ථකව පිවිසුණි" };
}

export async function signOutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/admin/login");
}

/* ------------------------------------------------------------------ */
/* Releases                                                            */
/* ------------------------------------------------------------------ */

export async function saveReleaseAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const db = getDb();

  const id = int(form, "id", 0);
  const title = str(form, "title");
  const titleEn = str(form, "title_en");
  const categoryId = int(form, "category_id", 0);

  const fieldErrors: Record<string, string> = {};
  if (!title) fieldErrors.title = "සිංහල නම අවශ්‍යයි.";
  if (!categoryId) fieldErrors.category_id = "ප්‍රවර්ගයක් තෝරන්න.";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "කරුණාකර අවශ්‍ය ක්ෂේත්‍ර පිරවන්න.", fieldErrors };
  }

  const qualities = parseQualities(form);
  const slug = uniqueSlug(str(form, "slug") || titleEn || title, id || undefined);

  const payload = {
    category_id: categoryId,
    code: uniqueCode(
      str(form, "code") || `B10-${Date.now().toString(36).toUpperCase().slice(-5)}`,
      id || undefined,
    ),
    title,
    title_en: titleEn,
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
    language: "sinhala" as const,
    tags: str(form, "tags"),
    featured: flag(form, "featured") ? 1 : 0,
    status: (str(form, "status", "published") as ReleaseStatus) || "published",
  };

  const save = db.transaction(() => {
    let releaseId = id;
    if (id > 0) {
      db.prepare(
        `UPDATE releases SET
           category_id = @category_id, code = @code, title = @title, title_en = @title_en,
           slug = @slug, season = @season, episode_number = @episode_number,
           episode_type = @episode_type, synopsis = @synopsis, thumbnail = @thumbnail,
           quality = @quality, duration_minutes = @duration_minutes,
           dubbed_studio = @dubbed_studio, dubbed_date = @dubbed_date, aired_date = @aired_date,
           telegram_url = @telegram_url, source = @source, tags = @tags,
           featured = @featured, status = @status, updated_at = datetime('now')
         WHERE id = @id`,
      ).run({ ...payload, id });
    } else {
      const info = db
        .prepare(
          `INSERT INTO releases (
             category_id, code, title, title_en, slug, season, episode_number, episode_type,
             synopsis, thumbnail, quality, duration_minutes, dubbed_studio, dubbed_date,
             aired_date, telegram_url, source, language, tags, featured, status
           ) VALUES (
             @category_id, @code, @title, @title_en, @slug, @season, @episode_number, @episode_type,
             @synopsis, @thumbnail, @quality, @duration_minutes, @dubbed_studio, @dubbed_date,
             @aired_date, @telegram_url, @source, @language, @tags, @featured, @status
           )`,
        )
        .run(payload);
      releaseId = Number(info.lastInsertRowid);
    }

    db.prepare("DELETE FROM qualities WHERE release_id = ?").run(releaseId);
    const insertQuality = db.prepare(
      "INSERT INTO qualities (release_id, label, url, file_size_mb, position) VALUES (?, ?, ?, ?, ?)",
    );
    qualities.forEach((quality, index) => {
      insertQuality.run(
        releaseId,
        quality.label || `සබැඳිය ${index + 1}`,
        quality.url,
        quality.file_size_mb,
        index,
      );
    });
  });

  save();

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
    getDb().prepare("DELETE FROM releases WHERE id = ?").run(id);
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
    getDb()
      .prepare(
        `UPDATE releases
         SET status = CASE WHEN status = 'published' THEN 'draft' ELSE 'published' END,
             updated_at = datetime('now')
         WHERE id = ?`,
      )
      .run(id);
  }
  revalidatePath("/admin/releases");
  revalidatePath("/releases");
  revalidatePath("/");
}

export async function toggleFeaturedAction(form: FormData): Promise<void> {
  await requireAdmin();
  const id = int(form, "id", 0);
  if (id > 0) {
    getDb()
      .prepare("UPDATE releases SET featured = CASE WHEN featured = 1 THEN 0 ELSE 1 END WHERE id = ?")
      .run(id);
  }
  revalidatePath("/admin/releases");
  revalidatePath("/");
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export async function saveCategoryAction(form: FormData): Promise<void> {
  await requireAdmin();
  const db = getDb();
  const id = int(form, "id", 0);
  const name = str(form, "name");
  const nameSi = str(form, "name_si");
  const description = str(form, "description");
  const accent = str(form, "accent", "#39FF14") || "#39FF14";
  const sortOrder = int(form, "sort_order", 0);
  const slug = slugify(str(form, "slug") || name);

  if (!name) redirect("/admin/categories?error=name");

  if (id > 0) {
    db.prepare(
      `UPDATE categories SET name = ?, name_si = ?, slug = ?, description = ?, accent = ?, sort_order = ?
       WHERE id = ?`,
    ).run(name, nameSi, slug, description, accent, sortOrder, id);
  } else {
    db.prepare(
      `INSERT INTO categories (name, name_si, slug, description, accent, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(name, nameSi, slug, description, accent, sortOrder);
  }

  revalidatePath("/");
  revalidatePath("/releases");
  revalidatePath("/admin/categories");
  redirect("/admin/categories?saved=1");
}

export async function deleteCategoryAction(form: FormData): Promise<void> {
  await requireAdmin();
  const db = getDb();
  const id = int(form, "id", 0);
  const used = db.prepare("SELECT COUNT(*) AS c FROM releases WHERE category_id = ?").get(id) as {
    c: number;
  };
  if (used.c > 0) {
    redirect("/admin/categories?error=inuse");
  }
  db.prepare("DELETE FROM categories WHERE id = ?").run(id);
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
  updateSettings(patch);
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}

/**
 * Uploads the site logo straight from the admin panel.
 * Accepts png / jpg / webp / svg up to 3 MB and stores it in /public/uploads,
 * then points the `logo_url` setting at it.
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

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(uploadDir, { recursive: true });

  const fileName = `logo-${Date.now()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(uploadDir, fileName), buffer);

  updateSettings({ logo_url: `/uploads/${fileName}` });

  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1&uploaded=1");
}

/* ------------------------------------------------------------------ */
/* Public helpers                                                      */
/* ------------------------------------------------------------------ */

export async function registerViewAction(id: number): Promise<void> {
  if (!Number.isFinite(id) || id <= 0) return;
  const release = getReleaseById(id);
  if (!release) return;
  getDb().prepare("UPDATE releases SET views = views + 1 WHERE id = ?").run(id);
}
