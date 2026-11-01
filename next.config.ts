import type { NextConfig } from "next";

// Old Wix URLs → new URLs, so links and search rankings survive the move.
const nextConfig: NextConfig = {
  // Admin image uploads (5 MB max per image, checked in app/admin/about/actions.ts)
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  async redirects() {
    return [
      { source: "/post/:slug", destination: "/insights/:slug", permanent: true },
      { source: "/blog", destination: "/insights", permanent: true },
      { source: "/research", destination: "/insights", permanent: true },
      // Indexes now live on the Insights page; each index keeps its own page at /indexes/[slug]
      { source: "/indexes", destination: "/insights", permanent: true },
      { source: "/research/:slug", destination: "/indexes/:slug", permanent: true },
      { source: "/future-summit", destination: "/events/future-summit-vienna-2026", permanent: true },
      { source: "/future-summit-ibiza", destination: "/events/future-summit-ibiza-2027", permanent: true },
      { source: "/event-details/future-summit-vienna", destination: "/events/future-summit-vienna-2026/register", permanent: true },
      { source: "/event-details/:slug", destination: "/events", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
