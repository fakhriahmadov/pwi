import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { site } from "@/content/site";
import { isPreview } from "@/lib/content";
import "@/styles/design-system/tokens.css";
import "@/styles/design-system/bundle.css";
import "./globals.css";

// Re-render hourly so events move to "Past" without a redeploy.
export const revalidate = 3600;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.tagline,
  openGraph: { siteName: site.name, type: "website", locale: "en_GB" },
  alternates: { types: { "application/rss+xml": "/insights/rss.xml" } },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const plausible = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const preview = await isPreview();
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
        {plausible && <script defer data-domain={plausible} src="https://plausible.io/js/script.js" />}
      </head>
      <body>
        <a href="#main" className="skip">Skip to content</a>
        {preview && (
          <div role="status" style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--red)", color: "var(--paper)", padding: "10px var(--gutter)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, fontSize: 14 }}>
            <span><b>Preview</b> — you are seeing unpublished changes. Visitors don’t see them yet.</span>
            <a href="/api/preview/exit" style={{ color: "var(--paper)", fontWeight: 600 }}>Exit preview</a>
          </div>
        )}
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
