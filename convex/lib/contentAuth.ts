/**
 * Authentication and transport rules for the content API in `convex/http.ts`.
 *
 * Everything here is pure so the rules can be tested without a deployment and the
 * HTTP action stays a thin adapter: cap the body, authorize, delegate.
 *
 * The credential is a bearer token the owner generates and keeps in `.env.local`.
 * Only its SHA-256 digest is configured on the deployment, so a leaked environment
 * dump does not yield a usable token.
 */

/** Bodies larger than this are refused before they are parsed or stored. */
export const MAX_CONTENT_BODY_BYTES = 256 * 1024;

const BEARER_PATTERN = /^Bearer ([^\s]+)$/i;

/** The configured value is a SHA-256 hex digest; anything else is a configuration error. */
const TOKEN_HASH_PATTERN = /^[0-9a-f]{64}$/;

/**
 * Extracts the credential from an `Authorization` header. A scheme other than
 * Bearer is a rejection, not a different kind of request.
 */
export const readBearerToken = (authorization: string | null): string | null => {
  if (!authorization) return null;

  const match = BEARER_PATTERN.exec(authorization.trim());
  return match ? match[1] : null;
};

/** Lowercase hex SHA-256 of the raw token, matching `sha256sum` output. */
export const hashToken = async (token: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

/**
 * Compares two digests without an early exit, so the position of the first
 * differing character cannot be inferred from how long the check took.
 *
 * Both sides are fixed-width hex digests, so their length is not a secret.
 */
export const constantTimeEqual = (left: string, right: string): boolean => {
  if (left.length !== right.length) return false;

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return difference === 0;
};

/**
 * Fails closed. An unset, empty, or malformed configured digest denies every
 * request rather than leaving an unconfigured deployment open.
 */
export const isAuthorized = async (
  authorization: string | null,
  configuredHash: string | undefined
): Promise<boolean> => {
  if (!configuredHash) return false;

  const expected = configuredHash.trim().toLowerCase();
  if (!TOKEN_HASH_PATTERN.test(expected)) return false;

  const token = readBearerToken(authorization);
  if (!token) return false;

  return constantTimeEqual(await hashToken(token), expected);
};

export type CappedBody = { ok: true; text: string } | { ok: false };

/**
 * Reads a request body while refusing anything over the cap.
 *
 * A declared `content-length` is checked first so an oversized upload is refused
 * without being buffered. The read body is measured again because a chunked
 * request declares no length, and because the header is caller-supplied.
 */
export const readCappedBody = async (
  request: Request,
  limit: number = MAX_CONTENT_BODY_BYTES
): Promise<CappedBody> => {
  const declared = request.headers.get("content-length");

  if (declared !== null) {
    const bytes = Number(declared);
    if (!Number.isFinite(bytes) || bytes < 0 || bytes > limit) return { ok: false };
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).length > limit) return { ok: false };

  return { ok: true, text };
};

/**
 * JSON response for the content routes.
 *
 * Deliberately separate from `jsonResponse` in `convex/lib/http.ts`: that helper
 * publishes a CORS allowlist for the browser-facing forms, while these routes are
 * server-to-server and must not be callable from a page.
 */
export const contentJsonResponse = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
