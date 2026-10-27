import { httpRouter } from "convex/server";
import { ConvexError } from "convex/values";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";
import { resolveClientIdentity } from "./lib/clientIdentity";
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

export default http;
