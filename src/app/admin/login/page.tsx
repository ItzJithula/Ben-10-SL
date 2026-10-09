import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import AdminLoginForm from "@/components/admin/AdminLoginForm";
import OmnitrixWatch from "@/components/OmnitrixWatch";
import { adminPanelEnabled, isAdmin } from "@/lib/admin-auth";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Admin login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  const settings = await getSettings();
  const panelEnabled = adminPanelEnabled();

  return (
    <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div className="flex justify-center order-2 lg:order-1">
        <OmnitrixWatch size={280} interactive={false} />
      </div>

      <div className="order-1 lg:order-2">
        <div className="panel p-7 sm:p-9">
          <p className="mb-2 text-[0.66rem] font-black tracking-[0.32em] text-omni-400 uppercase">
            Admin access
          </p>
          <h1 className="font-display text-2xl font-black text-white sm:text-3xl">
            Sign in to {settings.site_name}
          </h1>
          <p className="mt-3 mb-7 text-sm leading-relaxed text-void-100">
            Sign in to publish releases, edit episodes and manage collections.
          </p>

          <AdminLoginForm />

          {!panelEnabled ? (
            <div className="mt-6 rounded-xl border border-alien-amber/40 bg-alien-amber/10 p-4 text-[0.7rem] leading-relaxed text-alien-amber">
              <p className="font-bold">The admin panel is locked</p>
              <p className="mt-1">
                No <code>ADMIN_PASSWORD</code> is configured. Set it (and{" "}
                <code>ADMIN_SESSION_SECRET</code>) in your environment, then restart the server.
              </p>
            </div>
          ) : (
            <p className="mt-6 rounded-xl border border-void-600 bg-void-950/60 p-4 text-[0.7rem] leading-relaxed text-void-200">
              Credentials are configured through the environment (<code className="text-omni-300">ADMIN_PASSWORD</code>).
              If you have lost them, check the server log or reset the environment variable.
            </p>
          )}

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 text-xs font-bold tracking-wider text-void-200 uppercase transition-colors hover:text-omni-300"
          >
            ← Back to the site
          </Link>
        </div>
      </div>
    </div>
  );
}
