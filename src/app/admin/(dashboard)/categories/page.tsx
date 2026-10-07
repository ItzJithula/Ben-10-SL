import type { Metadata } from "next";
import Link from "next/link";

import ConfirmSubmit, { SubmitButton } from "@/components/admin/ConfirmSubmit";
import Reveal from "@/components/Reveal";
import { deleteCategoryAction, saveCategoryAction } from "@/lib/actions";
import { listCategories } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Manage collections",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const inputClass =
  "w-full rounded-xl border border-void-500 bg-void-950/80 px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-void-400 focus:border-omni-400/70";

export default async function AdminCategoriesPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const categories = await listCategories();

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="panel p-6">
          <p className="text-[0.66rem] font-black tracking-[0.3em] text-omni-400 uppercase">
            Main collections
          </p>
          <h1 className="mt-2 font-display text-xl font-black text-white">Manage collections</h1>
          <p className="mt-1 text-sm text-void-100">
            Arrange the main collections — Classic, Alien Force, Ultimate Alien, Omniverse,
            Reboot and Movies & Specials. Each collection has its own accent colour.
          </p>
        </div>
      </Reveal>

      {query.saved ? (
        <p className="rounded-xl border border-omni-400/40 bg-omni-400/10 px-4 py-3 text-xs font-bold text-omni-200">
          Collection saved.
        </p>
      ) : null}
      {query.deleted ? (
        <p className="rounded-xl border border-alien-amber/40 bg-alien-amber/10 px-4 py-3 text-xs font-bold text-alien-amber">
          Collection deleted.
        </p>
      ) : null}
      {query.error === "slug" ? (
        <p className="rounded-xl border border-alien-red/40 bg-alien-red/10 px-4 py-3 text-xs font-bold text-alien-red">
          Another collection already uses that slug. Pick a different one.
        </p>
      ) : null}
      {query.error === "inuse" ? (
        <p className="rounded-xl border border-alien-red/40 bg-alien-red/10 px-4 py-3 text-xs font-bold text-alien-red">
          This collection still has releases, so it cannot be deleted. Move those releases to another collection first.
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* list + inline edit */}
        <div className="space-y-4">
          {categories.map((category) => (
            <Reveal key={category.id}>
              <div className="panel overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="flex items-center gap-4">
                    <span
                      className="h-10 w-10 shrink-0 rounded-xl border"
                      style={{
                        borderColor: `${category.accent}66`,
                        background: `${category.accent}22`,
                        boxShadow: `0 0 18px -6px ${category.accent}`,
                      }}
                    />
                    <div>
                      <p className="font-display text-sm font-black text-white">
                        {category.name_alt || category.name}
                      </p>
                      <p className="text-[0.66rem] font-bold tracking-[0.2em] text-void-200 uppercase">
                        {category.name} · /{category.slug} · {category.release_count} releases
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/category/${category.slug}`}
                      className="rounded-lg border border-void-500 px-3 py-1.5 text-xs font-bold text-void-100 transition-colors hover:border-omni-400/50 hover:text-omni-300"
                    >
                      View
                    </Link>
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={category.id} />
                      <ConfirmSubmit
                        className="border-alien-red/40 text-alien-red hover:bg-alien-red/10"
                        message={`Delete the “${category.name}” collection?`}
                      >
                        Delete
                      </ConfirmSubmit>
                    </form>
                  </div>
                </div>

                <details className="border-t border-void-700">
                  <summary className="cursor-pointer px-5 py-3 text-[0.68rem] font-black tracking-[0.2em] text-omni-300 uppercase transition-colors hover:bg-omni-400/5">
                    Edit
                  </summary>

                  <form action={saveCategoryAction} className="grid gap-4 p-5 sm:grid-cols-2">
                    <input type="hidden" name="id" value={category.id} />
                    <label className="block">
                      <span className="mb-1.5 block text-[0.66rem] font-black tracking-[0.2em] text-void-100 uppercase">
                        Name
                      </span>
                      <input name="name" defaultValue={category.name} className={inputClass} required />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[0.66rem] font-black tracking-[0.2em] text-void-100 uppercase">
                        Alternate name
                      </span>
                      <input name="name_alt" defaultValue={category.name_alt} className={inputClass} />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[0.66rem] font-black tracking-[0.2em] text-void-100 uppercase">
                        Slug
                      </span>
                      <input name="slug" defaultValue={category.slug} className={inputClass} />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[0.66rem] font-black tracking-[0.2em] text-void-100 uppercase">
                        Accent colour
                      </span>
                      <input
                        name="accent"
                        type="color"
                        defaultValue={category.accent}
                        className="h-11 w-full rounded-xl border border-void-500 bg-void-950/80 px-2"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-1.5 block text-[0.66rem] font-black tracking-[0.2em] text-void-100 uppercase">
                        Description
                      </span>
                      <textarea
                        name="description"
                        rows={2}
                        defaultValue={category.description}
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[0.66rem] font-black tracking-[0.2em] text-void-100 uppercase">
                        Sort order
                      </span>
                      <input
                        name="sort_order"
                        type="number"
                        defaultValue={category.sort_order}
                        className={inputClass}
                      />
                    </label>
                    <div className="flex items-end">
                      <SubmitButton className="rounded-full bg-linear-to-r from-omni-400 to-omni-600 px-6 py-2.5 font-display text-xs font-black tracking-[0.2em] text-void-950 uppercase">
                        Save
                      </SubmitButton>
                    </div>
                  </form>
                </details>
              </div>
            </Reveal>
          ))}
        </div>

        {/* create */}
        <Reveal direction="left">
          <div className="panel p-6 lg:sticky lg:top-24">
            <h2 className="font-display text-sm font-black tracking-[0.2em] text-omni-300 uppercase">
              New collection
            </h2>
            <p className="mt-2 mb-5 text-xs leading-relaxed text-void-200">
              Add another collection — for example a special or a spin-off series.
            </p>

            <form action={saveCategoryAction} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[0.66rem] font-black tracking-[0.2em] text-void-100 uppercase">
                  Name *
                </span>
                <input name="name" className={inputClass} placeholder="Special Collection" required />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[0.66rem] font-black tracking-[0.2em] text-void-100 uppercase">
                  Alternate name
                </span>
                <input name="name_alt" className={inputClass} placeholder="2005 Series" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[0.66rem] font-black tracking-[0.2em] text-void-100 uppercase">
                  Slug
                </span>
                <input name="slug" className={inputClass} placeholder="special-collection" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[0.66rem] font-black tracking-[0.2em] text-void-100 uppercase">
                  Accent colour
                </span>
                <input
                  name="accent"
                  type="color"
                  defaultValue="#39FF14"
                  className="h-11 w-full rounded-xl border border-void-500 bg-void-950/80 px-2"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[0.66rem] font-black tracking-[0.2em] text-void-100 uppercase">
                  Description
                </span>
                <textarea name="description" rows={3} className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[0.66rem] font-black tracking-[0.2em] text-void-100 uppercase">
                  Sort order
                </span>
                <input
                  name="sort_order"
                  type="number"
                  defaultValue={categories.length + 1}
                  className={inputClass}
                />
              </label>

              <SubmitButton className="w-full rounded-full bg-linear-to-r from-omni-300 via-omni-400 to-omni-600 px-6 py-3 font-display text-xs font-black tracking-[0.2em] text-void-950 uppercase shadow-omni">
                Add collection
              </SubmitButton>
            </form>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
