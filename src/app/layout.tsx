import type { Metadata, Viewport } from "next";

import "./globals.css";

import BackToTop from "@/components/BackToTop";
import PageFade from "@/components/PageFade";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SmoothScroll from "@/components/SmoothScroll";
import { listCategories } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

// Everything is database driven — admin changes show up immediately.
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#39ff14",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSettings();
  return {
    metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
    title: {
      default: `${settings.site_name} — ${settings.site_tagline}`,
      template: `%s · ${settings.site_name}`,
    },
    description: settings.site_description,
    keywords: [
      "Ben 10 Sinhala",
      "බෙන් 10 සිංහල",
      "Ben 10 Sinhala dubbed",
      "Ben 10 SL",
      "සිංහල හඬකැවීම",
    ],
    icons: { icon: "/logo.svg" },
    openGraph: {
      title: `${settings.site_name} — ${settings.site_tagline}`,
      description: settings.site_description,
      type: "website",
      images: [settings.hero_image || "/art/hero-alien-tech.jpg"],
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = getSettings();
  const categories = listCategories();

  return (
    <html lang="si" suppressHydrationWarning>
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
