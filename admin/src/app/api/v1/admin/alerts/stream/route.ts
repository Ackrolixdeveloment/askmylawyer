import { API_ORIGIN } from "@/lib/api-origin";

/** Never cached, never pre-rendered: it is a long-lived stream. */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const fetchCache = "force-no-store";

/**
 * Pipes the backend's server-sent events to the browser.
 *
 * The plain `/api/v1/*` rewrite buffers this in development, so events only
 * showed up once the connection closed. Reading the upstream body chunk by
 * chunk and re-emitting it streams in both dev and production, and keeps the
 * session cookie first-party either way.
 */
export async function GET(request: Request) {
  let upstream: Response;

  try {
    upstream = await fetch(`${API_ORIGIN}/api/v1/admin/alerts/stream`, {
      headers: {
        cookie: request.headers.get("cookie") ?? "",
        accept: "text/event-stream",
      },
      signal: request.signal,
      cache: "no-store",
    });
  } catch {
    // The tab was closed, or the backend is down. Neither is an error worth
    // logging on every navigation.
    return new Response(null, { status: 204 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(await upstream.text(), { status: upstream.status });
  }

  const reader = upstream.body.getReader();

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        controller.enqueue(value);
      } catch {
        // The browser went away, or the backend restarted.
        controller.close();
      }
    },
    cancel() {
      void reader.cancel();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Tells nginx not to buffer it on the way to the browser.
      "X-Accel-Buffering": "no",
    },
  });
}
