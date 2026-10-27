import { httpRouter } from "convex/server";
import { ConvexError } from "convex/values";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";
import { resolveClientIdentity } from "./lib/clientIdentity";
import {
  contentJsonResponse,
  hashToken,
  isAuthorized,
  MAX_CONTENT_BODY_BYTES,
  readBearerToken,
  readCappedBody,
} from "./lib/contentAuth";
import { convertMarkdown } from "./lib/markdown";
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
): Promise<{ ok: true; body: string; fingerprint: string } | { ok: false; response: Response }> => {
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

  const authorization = request.headers.get("authorization");
  const authorized = await isAuthorized(authorization, process.env.CONTENT_API_TOKEN_SHA256);
  if (!authorized) {
    return {
      ok: false,
      response: contentJsonResponse(
        { error: "unauthorized: a valid bearer token is required" },
        401
      ),
    };
  }

  // The write budget is keyed on a fingerprint of the credential. Storing the
  // digest would be enough to authenticate a future request if it leaked; a
  // short prefix is enough to separate callers and carries no such value.
  const token = readBearerToken(authorization);
  const fingerprint = token ? (await hashToken(token)).slice(0, 16) : "";

  return { ok: true, body: read.text, fingerprint };
};

const CONTENT_BLOG_PATH = "/content/blog";
const CONTENT_BLOG_PREFIX = "/content/blog/";

type Field<T> = { ok: true; value: T } | { ok: false };

const readOptionalString = (
  body: Record<string, unknown>,
  key: string
): Field<string | undefined> => {
  const value = body[key];
  if (value === undefined || value === null) return { ok: true, value: undefined };
  if (typeof value !== "string") return { ok: false };

  const trimmed = value.trim();
  return { ok: true, value: trimmed === "" ? undefined : trimmed };
};

const readOptionalBoolean = (
  body: Record<string, unknown>,
  key: string
): Field<boolean | undefined> => {
  const value = body[key];
  if (value === undefined || value === null) return { ok: true, value: undefined };

  return typeof value === "boolean" ? { ok: true, value } : { ok: false };
};

/**
 * Reads a tag list. An absent key is `undefined`, never an empty list: a PATCH
 * that does not mention tags must not clear them.
 */
const readStringList = (
  body: Record<string, unknown>,
  key: string
): Field<string[] | undefined> => {
  const value = body[key];
  if (value === undefined || value === null) return { ok: true, value: undefined };
  if (!Array.isArray(value)) return { ok: false };

  const items: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || item.trim() === "") return { ok: false };
    items.push(item.trim());
  }

  return { ok: true, value: items };
};

/**
 * Turns a `{ code: "content_api" }` failure raised inside a mutation into the
 * response the caller sees. The payload is re-recognised by shape because the
 * error crosses a serialization boundary before it reaches this action.
 */
const contentFailureResponse = (error: unknown): Response | null => {
  const serialized: unknown =
    error instanceof ConvexError ? error.data : isRecord(error) ? error.data : null;
  const data = typeof serialized === "string" ? parseJson(serialized) : serialized;

  if (!isRecord(data) || data.code !== "content_api") return null;

  const status = typeof data.status === "number" ? data.status : 500;
  const message = typeof data.message === "string" ? data.message : "request failed";

  return contentJsonResponse({ error: message }, status);
};

type ContentPath = { slug: string; action: "publish" | "unpublish" | null };

/**
 * Reads the slug and trailing action off a prefixed route, forgiving a base path
 * in front of it. Convex routes match by prefix, not by parameter, so the shape
 * is parsed here rather than declared.
 */
const parseContentPath = (request: Request): ContentPath => {
  const path = new URL(request.url).pathname;
  const index = path.lastIndexOf(CONTENT_BLOG_PREFIX);
  if (index === -1) return { slug: "", action: null };

  const remainder = path.slice(index + CONTENT_BLOG_PREFIX.length).replace(/\/+$/, "");

  try {
    for (const action of ["publish", "unpublish"] as const) {
      const suffix = `/${action}`;
      if (remainder.endsWith(suffix)) {
        return { slug: decodeURIComponent(remainder.slice(0, -suffix.length)), action };
      }
    }

    return { slug: decodeURIComponent(remainder), action: null };
  } catch {
    return { slug: "", action: null };
  }
};

http.route({
  path: CONTENT_BLOG_PATH,
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const access = await requireContentAccess(request);
    if (!access.ok) return access.response;

    const payload = parseJson(access.body);
    if (!isRecord(payload)) {
      return contentJsonResponse({ error: "invalid request body: expected a JSON object" }, 400);
    }

    const title = readOptionalString(payload, "title");
    if (!title.ok || title.value === undefined) {
      return contentJsonResponse({ error: "title is required" }, 400);
    }

    const markdown = readOptionalString(payload, "bodyMarkdown");
    if (!markdown.ok || markdown.value === undefined) {
      return contentJsonResponse({ error: "bodyMarkdown is required" }, 400);
    }

    const slug = readOptionalString(payload, "slug");
    const excerpt = readOptionalString(payload, "excerpt");
    const coverImageUrl = readOptionalString(payload, "coverImageUrl");
    const categorySlug = readOptionalString(payload, "categorySlug");
    const publish = readOptionalBoolean(payload, "publish");
    const tags = readStringList(payload, "tags");

    if (!slug.ok) return contentJsonResponse({ error: "slug must be a string" }, 400);
    if (!excerpt.ok) return contentJsonResponse({ error: "excerpt must be a string" }, 400);
    if (!coverImageUrl.ok) {
      return contentJsonResponse({ error: "coverImageUrl must be a string" }, 400);
    }
    if (!categorySlug.ok) {
      return contentJsonResponse({ error: "categorySlug must be a string" }, 400);
    }
    if (!publish.ok) return contentJsonResponse({ error: "publish must be a boolean" }, 400);
    if (!tags.ok) return contentJsonResponse({ error: "tags must be an array of slugs" }, 400);

    const converted = convertMarkdown(markdown.value);
    if (!converted.ok) return contentJsonResponse({ error: converted.error }, 400);

    try {
      const created = await ctx.runMutation(internal.contentApi.create, {
        title: title.value,
        slug: slug.value,
        excerpt: excerpt.value,
        html: converted.html,
        readingTime: converted.readingTime,
        coverImageUrl: coverImageUrl.value,
        categorySlug: categorySlug.value,
        tagSlugs: tags.value ?? [],
        publish: publish.value ?? false,
        fingerprint: access.fingerprint,
      });

      return contentJsonResponse(created, 201);
    } catch (error) {
      const failure = contentFailureResponse(error);
      if (failure) return failure;

      console.error("Content API create failed:", error);
      return contentJsonResponse({ error: "unable to save the post" }, 500);
    }
  }),
});

http.route({
  path: CONTENT_BLOG_PATH,
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const access = await requireContentAccess(request);
    if (!access.ok) return access.response;

    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status");
    if (statusParam !== null && statusParam !== "draft" && statusParam !== "published") {
      return contentJsonResponse({ error: "status must be draft or published" }, 400);
    }

    const limitParam = url.searchParams.get("limit");
    const limit = limitParam === null ? undefined : Number(limitParam);
    if (limit !== undefined && !Number.isFinite(limit)) {
      return contentJsonResponse({ error: "limit must be a number" }, 400);
    }

    const posts = await ctx.runQuery(internal.contentApi.list, {
      status: statusParam === null ? undefined : statusParam,
      limit,
    });

    return contentJsonResponse({ posts }, 200);
  }),
});

http.route({
  pathPrefix: CONTENT_BLOG_PREFIX,
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const access = await requireContentAccess(request);
    if (!access.ok) return access.response;

    const { slug, action } = parseContentPath(request);
    if (action !== null) return contentJsonResponse({ error: "no such route" }, 404);
    if (slug === "") return contentJsonResponse({ error: "slug is required" }, 400);

    const post = await ctx.runQuery(internal.contentApi.getBySlug, { slug });
    if (!post) return contentJsonResponse({ error: `post not found: ${slug}` }, 404);

    return contentJsonResponse({ post }, 200);
  }),
});

http.route({
  pathPrefix: CONTENT_BLOG_PREFIX,
  method: "PATCH",
  handler: httpAction(async (ctx, request) => {
    const access = await requireContentAccess(request);
    if (!access.ok) return access.response;

    const { slug, action } = parseContentPath(request);
    if (action !== null) return contentJsonResponse({ error: "no such route" }, 404);
    if (slug === "") return contentJsonResponse({ error: "slug is required" }, 400);

    const payload = parseJson(access.body);
    if (!isRecord(payload)) {
      return contentJsonResponse({ error: "invalid request body: expected a JSON object" }, 400);
    }

    const title = readOptionalString(payload, "title");
    const excerpt = readOptionalString(payload, "excerpt");
    const coverImageUrl = readOptionalString(payload, "coverImageUrl");
    const categorySlug = readOptionalString(payload, "categorySlug");
    const markdown = readOptionalString(payload, "bodyMarkdown");
    const tags = readStringList(payload, "tags");

    if (!title.ok) return contentJsonResponse({ error: "title must be a string" }, 400);
    if (!excerpt.ok) return contentJsonResponse({ error: "excerpt must be a string" }, 400);
    if (!coverImageUrl.ok) {
      return contentJsonResponse({ error: "coverImageUrl must be a string" }, 400);
    }
    if (!categorySlug.ok) {
      return contentJsonResponse({ error: "categorySlug must be a string" }, 400);
    }
    if (!markdown.ok) {
      return contentJsonResponse({ error: "bodyMarkdown must be a string" }, 400);
    }
    if (!tags.ok) return contentJsonResponse({ error: "tags must be an array of slugs" }, 400);

    let body: { html: string; readingTime: number } | undefined;
    if (markdown.value !== undefined) {
      const converted = convertMarkdown(markdown.value);
      if (!converted.ok) return contentJsonResponse({ error: converted.error }, 400);
      body = { html: converted.html, readingTime: converted.readingTime };
    }

    try {
      const updated = await ctx.runMutation(internal.contentApi.update, {
        slug,
        title: title.value,
        excerpt: excerpt.value,
        body,
        coverImageUrl: coverImageUrl.value,
        categorySlug: categorySlug.value,
        tagSlugs: tags.value,
        fingerprint: access.fingerprint,
      });

      return contentJsonResponse(updated, 200);
    } catch (error) {
      const failure = contentFailureResponse(error);
      if (failure) return failure;

      console.error("Content API update failed:", error);
      return contentJsonResponse({ error: "unable to save the post" }, 500);
    }
  }),
});

http.route({
  pathPrefix: CONTENT_BLOG_PREFIX,
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const access = await requireContentAccess(request);
    if (!access.ok) return access.response;

    const { slug, action } = parseContentPath(request);
    if (action === null) {
      return contentJsonResponse(
        { error: `no such route: use ${CONTENT_BLOG_PATH} to create a post` },
        404
      );
    }
    if (slug === "") return contentJsonResponse({ error: "slug is required" }, 400);

    try {
      const result = await ctx.runMutation(internal.contentApi.setPublished, {
        slug,
        publish: action === "publish",
        fingerprint: access.fingerprint,
      });

      return contentJsonResponse(result, 200);
    } catch (error) {
      const failure = contentFailureResponse(error);
      if (failure) return failure;

      console.error(`Content API ${action} failed:`, error);
      return contentJsonResponse({ error: `unable to ${action} the post` }, 500);
    }
  }),
});

export default http;
