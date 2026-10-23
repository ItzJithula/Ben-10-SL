import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { OmnitrixMark } from "@/components/OmnitrixWatch";
import { isAdmin } from "@/lib/admin-auth";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Admin login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  const settings = await getSettings();

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <div className="panel relative overflow-hidden p-8 sm:p-10 shadow-omni-lg border border-omni-400/30">
        <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-omni-300 via-omni-400 to-omni-600" />
        
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-omni-400/40 bg-omni-400/10 text-omni-400 shadow-omni">
            <OmnitrixMark size={24} />
          </div>
          <div>
            <p className="text-[0.66rem] font-black tracking-[0.32em] text-omni-400 uppercase">
              Control Panel
            </p>
            <h1 className="font-display text-2xl font-black text-white">
              {settings.site_name || "Ben 10 SL"}
            </h1>
          </div>
        </div>

        <p className="mb-6 text-xs leading-relaxed text-void-100">
          Sign in to publish releases, manage episode links and update collections.
        </p>

        <AdminLoginForm />

        <div className="mt-6 rounded-xl border border-void-600 bg-void-950/70 p-3.5 text-[0.72rem] leading-relaxed text-void-200">
          <p className="font-semibold text-omni-300">Default Credentials:</p>
          <p className="mt-0.5">
            Username: <code className="text-white font-mono">admin</code> · Password:{" "}
            <code className="text-white font-mono">ben10admin</code>
          </p>
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 text-xs font-bold tracking-wider text-void-200 uppercase transition-colors hover:text-omni-300"
        >
          ← Back to the site
        </Link>
      </div>
    </div>
  );
}
