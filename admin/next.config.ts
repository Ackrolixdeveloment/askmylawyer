import type { NextConfig } from "next";

/**
 * Where the backend lives. The browser only ever talks to this app's own
 * `/api/v1/*`, which is forwarded here — so the auth cookies stay first-party
 * on localhost, on the Amplify URL, and on the final domain alike.
 */
const apiUrl = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${apiUrl}/api/v1/:path*` }];
  },
};

export default nextConfig;
