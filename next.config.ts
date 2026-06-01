import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: false, // Ensure PWA generates sw.js even in dev for testing if needed, though usually disabled in dev. Let's disable in dev.
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA(nextConfig);
