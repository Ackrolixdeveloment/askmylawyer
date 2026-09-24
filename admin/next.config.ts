import type { NextConfig } from "next";
import { API_ORIGIN } from "./src/lib/api-origin";

/**
 * The browser only ever talks to this app's own `/api/v1/*`, which is
 * forwarded to the backend — so the auth cookies stay first-party on
 * localhost, on the Amplify URL, and on the final domain alike.
 *
 * `src/app/api/v1/admin/alerts/stream` is handled by a route handler
 * instead: rewrites buffer a server-sent event stream in development.
 */
if (process.env.NODE_ENV !== "production") {
  console.log(`[admin] /api/v1/* → ${API_ORIGIN}`);
}

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${API_ORIGIN}/api/v1/:path*` }];
  },
};

export default nextConfig;
