"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { signInAction, type ActionState } from "@/lib/actions";
import { OmnitrixMark } from "@/components/OmnitrixWatch";

const INITIAL: ActionState = { ok: false, message: "" };

export default function AdminLoginForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(signInAction, INITIAL);

  useEffect(() => {
    if (state.ok) {
      router.replace("/admin");
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label
          htmlFor="username"
          className="mb-2 block text-[0.68rem] font-black tracking-[0.24em] text-void-200 uppercase"
        >
          පරිශීලක නාමය
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          defaultValue="admin"
          className="w-full rounded-xl border border-void-500 bg-void-950/80 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-omni-400/70"
          required
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-[0.68rem] font-black tracking-[0.24em] text-void-200 uppercase"
        >
          මුරපදය
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="w-full rounded-xl border border-void-500 bg-void-950/80 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-omni-400/70"
          required
        />
      </div>

      {state.message ? (
        <p
          className={
            state.ok
              ? "rounded-xl border border-omni-400/40 bg-omni-400/10 px-4 py-3 text-xs font-bold text-omni-200"
              : "rounded-xl border border-alien-red/40 bg-alien-red/10 px-4 py-3 text-xs font-bold text-alien-red"
          }
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-linear-to-r from-omni-300 via-omni-400 to-omni-600 px-6 py-3.5 font-display text-xs font-black tracking-[0.2em] text-void-950 uppercase shadow-omni transition-transform hover:scale-[1.01] disabled:opacity-70"
      >
        <OmnitrixMark size={18} className="text-void-950" />
        {pending ? "පිවිසෙමින්…" : "පිවිසෙන්න"}
      </button>
    </form>
  );
}
