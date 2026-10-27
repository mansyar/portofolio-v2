import { httpRouter } from "convex/server";
import { ConvexError } from "convex/values";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";
import { resolveClientIdentity } from "./lib/clientIdentity";
import {
  contentJsonResponse,
  isAuthorized,
  MAX_CONTENT_BODY_BYTES,
  readCappedBody,
} from "./lib/contentAuth";
import { jsonResponse, preflightResponse } from "./lib/http";

const http = httpRouter();

auth.addHttpRoutes(http);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readJsonObject = async (request: Request): Promise<Record<string, unknown> | null> => {
  try {
    const parsed: unknown = await request.json();
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const textField = (body: Record<string, unknown>, key: string): string | null => {
  const value = body[key];
  return typeof value === "string" && value.trim() !== "" ? value : null;
};

const parseJson = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

/**
 * The rate limit is enforced in the mutation, inside the transaction, and
 * signalled with `ConvexError` so its message survives the action boundary.
 *
 * Convex serializes the payload, and the runtime that deserializes it on the
 * other side of `runMutation` is not guaranteed to be the same class instance,
 * so the error is recognised by its payload shape rather than by `instanceof`
 * alone.
 */
const rateLimitedMessage = (error: unknown): string | null => {
  const serialized: unknown =
    error instanceof ConvexError ? error.data : isRecord(error) ? error.data : null;

  const data = typeof serialized === "string" ? parseJson(serialized) : serialized;
  if (!isRecord(data) || data.code !== "rate_limited") return null;

  return typeof data.message === "string"
    ? data.message
    : "Too many attempts. Please try again later.";
};

// =============================================================================
// Contact form
// =============================================================================

http.route({
  path: "/contact",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => preflightResponse(request)),
});

http.route({
  path: "/contact",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await readJsonObject(request);
    if (!body) {
      return jsonResponse(request, { error: "Invalid request body." }, 400);
    }

    const name = textField(body, "name");
    const email = textField(body, "email");
    const subject = textField(body, "subject");
    const message = textField(body, "message");

    if (!name || !email || !subject || !message) {
      return jsonResponse(request, { error: "Please complete every field." }, 400);
    }

    const honeypot = typeof body.honeypot === "string" ? body.honeypot : undefined;

    // Bots that fill the hidden field are told they succeeded, as before, so the
    // form does not tell them which input gave them away.
    if (honeypot) {
      return jsonResponse(request, { success: true }, 200);
    }

    // A request whose connection cannot be attributed has no second key on this
    // path, so it is refused rather than pooled into a bucket every other
    // unresolved caller would share.
    const identifier = resolveClientIdentity(request.headers);
    if (!identifier) {
      return jsonResponse(request, { error: "Too many submissions. Please try again later." }, 429);
    }

    try {
      await ctx.runMutation(internal.contact.submit, {
        name,
        email,
        subject,
        message,
        honeypot,
        identifier,
      });
      return jsonResponse(request, { success: true }, 200);
    } catch (error) {
      const limited = rateLimitedMessage(error);
      if (limited) {
        return jsonResponse(request, { error: limited }, 429);
      }

      console.error("Contact submission failed:", error);
      return jsonResponse(
        request,
        { error: "Unable to send your message. Please try again later." },
        500
      );
    }
  }),
});

// =============================================================================
// Newsletter signup
// =============================================================================

http.route({
  path: "/newsletter/subscribe",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => preflightResponse(request)),
});

http.route({
  path: "/newsletter/subscribe",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await readJsonObject(request);
    if (!body) {
      return jsonResponse(request, { error: "Invalid request body." }, 400);
    }

    const email = textField(body, "email");
    if (email?.includes("@") !== true) {
      return jsonResponse(request, { error: "Please enter a valid email address." }, 400);
    }

    // Signup must survive an unattributable connection: the address-keyed limit
    // is still enforced, so an unresolved caller gains no allowance.
    const identifier = resolveClientIdentity(request.headers);

    try {
      const result = await ctx.runMutation(internal.newsletter.subscribe, {
        email,
        identifier,
      });
      return jsonResponse(request, result, 200);
    } catch (error) {
      const limited = rateLimitedMessage(error);
      if (limited) {
        return jsonResponse(request, { error: limited }, 429);
      }

      console.error("Newsletter subscription failed:", error);
      return jsonResponse(request, { error: "Subscription failed. Please try again later." }, 500);
    }
  }),
});

// =============================================================================
// Content API
// =============================================================================
//
// Server-to-server writes for the CMS. Unlike the two public forms above, these
// routes publish no CORS headers: a browser is never a legitimate caller, and an
// allowlist would only widen the surface.

/**
 * Applies the transport rules shared by every content route and returns the body
 * so a handler does not read it twice.
 *
 * The size check runs before authentication so an oversized request is refused
 * without the body being buffered, and both rejections carry the same shape the
 * callers parse.
 */
const requireContentAccess = async (
  request: Request
): Promise<{ ok: true; body: string } | { ok: false; response: Response }> => {
  const read = await readCappedBody(request);
  if (!read.ok) {
    return {
      ok: false,
      response: contentJsonResponse(
        { error: `request body exceeds ${MAX_CONTENT_BODY_BYTES} bytes` },
        413
      ),
    };
  }

  const authorized = await isAuthorized(
    request.headers.get("authorization"),
    process.env.CONTENT_API_TOKEN_SHA256
  );
  if (!authorized) {
    return {
      ok: false,
      response: contentJsonResponse(
        { error: "unauthorized: a valid bearer token is required" },
        401
      ),
    };
  }

  return { ok: true, body: read.text };
};

http.route({
  path: "/content/blog",
  method: "POST",
  handler: httpAction(async (_ctx, request) => {
    const access = await requireContentAccess(request);
    if (!access.ok) return access.response;

    // The transport contract is all this phase owns; the create mutation that
    // consumes `access.body` lands in the next phase of the track.
    return contentJsonResponse({ error: "not implemented yet" }, 501);
  }),
});

export default http;
