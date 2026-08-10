import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Using Turbopack (Next.js 16 default) — no webpack config needed
  turbopack: {},

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  async rewrites() {
    // In production on Vercel the API calls go directly to NEXT_PUBLIC_API_URL.
    // The rewrite is only used in local dev when running against a local backend.
    const backendOrigin = process.env.BACKEND_ORIGIN;
    if (!backendOrigin) return [];

    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
