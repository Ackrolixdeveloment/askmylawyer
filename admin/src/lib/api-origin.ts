/**
 * Where the backend lives. Shared by next.config.ts (which rewrites
 * /api/v1/* to it) and by the few route handlers that proxy a request
 * themselves.
 *
 * The default is the shared development tunnel, so a fresh checkout works
 * without any setup. Point `API_URL` at your own backend — or the EC2 API on
 * Amplify — to override it.
 */
const DEV_TUNNEL = "https://f194n1ll-4000.inc1.devtunnels.ms";

export const API_ORIGIN = (process.env.API_URL ?? DEV_TUNNEL).replace(/\/$/, "");
