import type { NextConfig } from "next";

/**
 * Where the backend lives, for when the landing pages start reading their
 * content from the CMS. Until then the pages render from `src/content`, so
 * nothing here is used yet — the rewrite is in place so switching over is a
 * one-line change in the page rather than a config change.
 *
 * `next dev` talks to the backend on this machine; a production build
 * talks to the live API. Set `API_URL` to point either somewhere else.
 */
const LOCAL_API = "http://localhost:4000";
const LIVE_API = "https://api.amlst.in";

const defaultApi = process.env.NODE_ENV === "production" ? LIVE_API : LOCAL_API;

const apiUrl = (process.env.API_URL || defaultApi).replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${apiUrl}/api/v1/:path*` }];
  },
};

export default nextConfig;
