/**
 * Transport helpers for the public write endpoints in `convex/http.ts`.
 *
 * A JSON `POST` from the browser is preceded by an `OPTIONS` preflight, and the
 * response to both has to name the caller's origin exactly. Only the configured
 * site origin and loopback development are allowed; anything else gets no
 * `Access-Control-Allow-Origin`, which the browser turns into a blocked request.
 */

/**
 * The canonical public origin is always allowed. It must not be derived from
 * `SITE_URL`: that variable holds the deployment's HTTP base so mail can build
 * absolute links, and production sets it to `https://api.ansyar-world.top/http`.
 * Deriving the allowlist from it matched no browser origin and silently blocked
 * both live forms — a config value that is not an origin cannot protect one.
 */
const CANONICAL_SITE_ORIGIN = "https://ansyar-world.top";

const LOOPBACK_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

/**
 * `SITE_URL` is still honoured when it really is an origin (staging, previews),
 * because those deployments legitimately serve from a different host. A value
 * that cannot be parsed as a URL contributes nothing rather than an empty entry.
 */
const configuredOrigin = (): string | null => {
  const configured = process.env.SITE_URL?.trim();
  if (!configured) return null;

  try {
    return new URL(configured).origin;
  } catch {
    return null;
  }
};

export const allowedOrigins = (): string[] => {
  const origins = [CANONICAL_SITE_ORIGIN];
  const configured = configuredOrigin();
  if (configured) origins.push(configured);

  for (const loopback of LOOPBACK_ORIGINS) {
    if (!origins.includes(loopback)) origins.push(loopback);
  }

  return origins;
};

const corsHeaders = (request: Request): Record<string, string> => {
  // `Vary: Origin` keeps a shared cache from serving one origin's preflight to
  // another.
  const headers: Record<string, string> = { vary: "Origin" };
  const origin = request.headers.get("origin");

  if (origin && allowedOrigins().includes(origin)) {
    headers["access-control-allow-origin"] = origin;
  }

  return headers;
};

export const jsonResponse = (request: Request, body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders(request) },
  });

export const preflightResponse = (request: Request): Response =>
  new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(request),
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "Content-Type",
      "access-control-max-age": "86400",
    },
  });
