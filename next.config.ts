import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {},
  async redirects() {
    return [
      // Redirect old /library routes to /videos
      {
        source: "/library",
        destination: "/videos",
        permanent: true,
      },
      {
        source: "/library/collections/:path*",
        destination: "/collections/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
