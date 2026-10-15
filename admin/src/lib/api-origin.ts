/**
 * Where the backend lives. Shared by next.config.ts (which rewrites
 * /api/v1/* to it) and by the few route handlers that proxy a request
 * themselves.
 *
 * `next dev` talks to the backend on this machine; a production build
 * talks to the live API. Set `API_URL` to point either somewhere else
 * (e.g. a dev tunnel).
 */
const LOCAL_API = "http://localhost:4000";
const LIVE_API = "https://api.amlst.in";

const DEFAULT_ORIGIN = process.env.NODE_ENV === "production" ? LIVE_API : LOCAL_API;

export const API_ORIGIN = (process.env.API_URL || DEFAULT_ORIGIN).replace(/\/$/, "");
