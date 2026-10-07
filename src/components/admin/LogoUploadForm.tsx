"use client";

import { useRef, useState } from "react";

import { uploadLogoAction } from "@/lib/actions";
import { SubmitButton } from "./ConfirmSubmit";

/** Drop-in logo uploader for the admin settings screen. */
export default function LogoUploadForm({ currentUrl }: { currentUrl: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <form action={uploadLogoAction} className="flex flex-wrap items-center gap-5">
      <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-omni-400/40 bg-void-950">
        {preview || currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview ?? currentUrl} alt="Site logo" className="h-full w-full object-cover" />
        ) : (
          <span className="text-omni-300">?</span>
        )}
      </span>

      <label className="flex-1 min-w-[240px] cursor-pointer">
        <span className="mb-1.5 block text-[0.66rem] font-black tracking-[0.2em] text-void-100 uppercase">
          Choose an image file
        </span>
        <input
          ref={inputRef}
          type="file"
          name="logo"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          required
          onChange={(event) => {
            const file = event.target.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : null);
          }}
          className="w-full cursor-pointer rounded-xl border border-void-500 bg-void-950/80 px-4 py-2.5 text-xs text-void-100 file:mr-4 file:rounded-full file:border-0 file:bg-omni-400/20 file:px-4 file:py-2 file:text-[0.68rem] file:font-black file:tracking-wider file:text-omni-200 file:uppercase"
        />
      </label>

      <SubmitButton
        className="rounded-full bg-linear-to-r from-omni-300 via-omni-400 to-omni-600 px-6 py-3 font-display text-xs font-black tracking-[0.2em] text-void-950 uppercase shadow-omni"
        pendingLabel="Uploading…"
      >
        Upload logo
      </SubmitButton>
    </form>
  );
}
