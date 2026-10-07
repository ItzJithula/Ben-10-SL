import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import AdminLoginForm from "@/components/admin/AdminLoginForm";
import OmnitrixWatch from "@/components/OmnitrixWatch";
import { adminPanelEnabled, isAdmin } from "@/lib/admin-auth";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "පරිපාලක පිවිසුම",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  const settings = getSettings();
  const panelEnabled = adminPanelEnabled();

  return (
    <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div className="flex justify-center order-2 lg:order-1">
        <OmnitrixWatch size={280} />
      </div>

      <div className="order-1 lg:order-2">
        <div className="panel p-7 sm:p-9">
          <p className="mb-2 text-[0.66rem] font-black tracking-[0.32em] text-omni-400 uppercase">
            පරිපාලක ප්‍රවේශය
          </p>
          <h1 className="font-display text-2xl font-black text-white sm:text-3xl">
            {settings.site_name} පැනලයට පිවිසෙන්න
          </h1>
          <p className="mt-3 mb-7 text-sm leading-relaxed text-void-100">
            නිකුතු එක් කිරීම, සංස්කරණය හා මාලාවන් කළමනාකරණය සඳහා පිවිසෙන්න.
          </p>

          <AdminLoginForm />

          {!panelEnabled ? (
            <div className="mt-6 rounded-xl border border-alien-amber/40 bg-alien-amber/10 p-4 text-[0.7rem] leading-relaxed text-alien-amber">
              <p className="font-bold">පරිපාලක පැනලය අගුළු දමා ඇත</p>
              <p className="mt-1">
                ADMIN_PASSWORD සකසා නැත. පරිසර විචල්‍යයේ <code>ADMIN_PASSWORD</code> සහ{" "}
                <code>ADMIN_SESSION_SECRET</code> සකසා සේවාදායකය නැවත අරඹන්න.
              </p>
            </div>
          ) : (
            <p className="mt-6 rounded-xl border border-void-600 bg-void-950/60 p-4 text-[0.7rem] leading-relaxed text-void-200">
              පිවිසුම් තොරතුරු පරිසර විචල්‍යයෙන් (<code className="text-omni-300">ADMIN_PASSWORD</code>)
              සකසා ඇත. ඒවා අමතක වූයේ නම් සේවාදායක ලොගය බලන්න හෝ පරිසර විචල්‍යය නැවත සකසන්න.
            </p>
          )}

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 text-xs font-bold tracking-wider text-void-200 uppercase transition-colors hover:text-omni-300"
          >
            ← වෙබ් අඩවියට ආපසු
          </Link>
        </div>
      </div>
    </div>
  );
}
