import type { NextConfig } from "next";

/**
 * Where the backend lives, for when the landing pages start reading their
 * content from the CMS. Until then the pages render from `src/content`, so
 * nothing here is used yet — the rewrite is in place so switching over is a
 * one-line change in the page rather than a config change.
 *
 * The default is the shared development tunnel, so a fresh checkout works
 * without any setup. Point `API_URL` at your own backend to override it.
 */
const DEV_TUNNEL = "https://f194n1ll-4000.inc1.devtunnels.ms";

const apiUrl = (process.env.API_URL ?? DEV_TUNNEL).replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${apiUrl}/api/v1/:path*` }];
  },
};

export default nextConfig;
