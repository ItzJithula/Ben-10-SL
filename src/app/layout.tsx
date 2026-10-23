import type { Metadata, Viewport } from "next";

import "./globals.css";

import BackToTop from "@/components/BackToTop";
import PageFade from "@/components/PageFade";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SmoothScroll from "@/components/SmoothScroll";
import { listCategories } from "@/lib/queries";
import { DEFAULT_SETTINGS, getSettings } from "@/lib/settings";

// Everything is database driven — admin changes show up immediately.
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#39ff14",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  let settings = DEFAULT_SETTINGS;
  try {
    settings = await getSettings();
  } catch {
    // fallback to defaults
  }

  let baseUrl = "http://localhost:3000";
  try {
    const raw = process.env.SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    baseUrl = new URL(raw).origin;
  } catch {
    baseUrl = "http://localhost:3000";
  }

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: `${settings.site_name || "Ben 10 SL"} — ${settings.site_tagline || "Sinhala Dubbed Episodes"}`,
      template: `%s · ${settings.site_name || "Ben 10 SL"}`,
    },
    description: settings.site_description || "Ben 10 Sinhala Dubbed Episodes",
    keywords: [
      "Ben 10 Sinhala",
      "Ben 10 Sinhala dubbed",
      "Ben 10 Sinhala dub download",
      "Ben 10 SL",
      "Sinhala dubbed cartoons",
    ],
    icons: { icon: "/favicon.ico" },
    openGraph: {
      title: `${settings.site_name || "Ben 10 SL"} — ${settings.site_tagline || "Sinhala Dubbed Episodes"}`,
      description: settings.site_description || "Ben 10 Sinhala Dubbed Episodes",
      type: "website",
      images: [settings.hero_image || "/art/hero-alien-tech.jpg"],
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settingsResult, categoriesResult] = await Promise.allSettled([getSettings(), listCategories()]);
  const settings = settingsResult.status === "fulfilled" ? settingsResult.value : DEFAULT_SETTINGS;
  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <SmoothScroll>
          <SiteHeader settings={settings} categories={categories} />
          <main>
            <PageFade>{children}</PageFade>
          </main>
          <SiteFooter settings={settings} categories={categories} />
          <BackToTop />
        </SmoothScroll>
      </body>
    </html>
  );
}
