/**
 * Client for the deployment's public HTTP endpoints (`convex/http.ts`).
 *
 * The contact form and newsletter signup are rate limited on the identity the
 * server derives from the request connection, so they must reach Convex over
 * HTTP rather than through a mutation that would have to be told who is calling.
 * Both forms share this one call site; duplicating it is what let the previous
 * IP resolver drift between the two files.
 */

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

const endpoint = (path: string): string => {
  if (!convexUrl) {
    throw new Error("VITE_CONVEX_URL is not configured");
  }
  return `${convexUrl.replace(/\/+$/, "")}${path}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export interface HttpResult {
  ok: boolean;
  status: number;
  data: unknown;
}

export async function postToConvex(path: string, body: unknown): Promise<HttpResult> {
  const response = await fetch(endpoint(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // A 502 from a proxy or an empty body must not throw here; the caller decides
  // what to say, and `ok` already reports the failure.
  const data: unknown = await response.json().catch(() => null);

  return { ok: response.ok, status: response.status, data };
}

/** Prefers the server's own message so a rate-limited caller sees why. */
export const responseError = (data: unknown, fallback: string): string => {
  if (isRecord(data) && typeof data.error === "string" && data.error.trim() !== "") {
    return data.error;
  }
  return fallback;
};
