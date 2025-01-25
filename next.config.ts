import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  },
};

export default nextConfig;
