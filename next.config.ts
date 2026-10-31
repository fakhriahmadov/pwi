import type { NextConfig } from "next";

// Old Wix URLs → new URLs, so links and search rankings survive the move.
const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/post/:slug", destination: "/insights/:slug", permanent: true },
      { source: "/blog", destination: "/insights", permanent: true },
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
