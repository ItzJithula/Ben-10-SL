/**
 * Shared domain types for Ben 10 SL.
 * Every release on the site is stored in SQLite and exposed through these shapes.
 */

export type EpisodeType = "episode" | "movie" | "special" | "short";

export type ReleaseStatus = "published" | "draft";

export type AudioLanguage = "sinhala" | "sinhala-subbed" | "english-subbed";

export interface Category {
  id: number;
  name: string;
  name_si: string;
  slug: string;
  description: string;
  accent: string;
  sort_order: number;
  created_at: string;
}

export interface CategoryWithCount extends Category {
  release_count: number;
}

export interface Quality {
  id: number;
  release_id: number;
  label: string;
  url: string;
  file_size_mb: number | null;
  position: number;
}

export interface Release {
  id: number;
  category_id: number;
  code: string;
  title: string;
  title_en: string;
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
  language: AudioLanguage;
  tags: string;
  views: number;
  featured: 0 | 1;
  status: ReleaseStatus;
  created_at: string;
  updated_at: string;
}

export interface ReleaseWithMeta extends Release {
  category_name: string;
  category_name_si: string;
  category_slug: string;
  category_accent: string;
  link_count: number;
}

export interface ReleaseDetail extends ReleaseWithMeta {
  qualities: Quality[];
}

export interface ReleaseFilters {
  q?: string;
  category?: string;
  type?: string;
  status?: string;
  sort?: string;
  page?: number;
  perPage?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  perPage: number;
}

export interface ReleaseInput {
  category_id: number;
  code: string;
  title: string;
  title_en: string;
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
  language: AudioLanguage;
  tags: string;
  featured: boolean;
  status: ReleaseStatus;
}

export interface QualityInput {
  label: string;
  url: string;
  file_size_mb: number | null;
}

export interface AdminStats {
  releases: number;
  published: number;
  drafts: number;
  categories: number;
  movieCount: number;
  totalViews: number;
  linkCount: number;
  perCategory: { name: string; name_si: string; slug: string; accent: string; count: number }[];
  latest: ReleaseWithMeta[];
}
