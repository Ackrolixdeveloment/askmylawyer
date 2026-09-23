import type { NextConfig } from "next";

/**
 * Where the backend lives. The browser only ever talks to this app's own
 * `/api/v1/*`, which is forwarded here — so the auth cookies stay first-party
 * on localhost, on the Amplify URL, and on the final domain alike.
 *
 * The default is the shared development tunnel, so a fresh checkout works
 * without any setup. Point `API_URL` at your own backend (or the EC2 API on
 * Amplify) to override it.
 */
const DEV_TUNNEL = "https://f194n1ll-4000.inc1.devtunnels.ms";

const apiUrl = (process.env.API_URL ?? DEV_TUNNEL).replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${apiUrl}/api/v1/:path*` }];
  },
};

export default nextConfig;
