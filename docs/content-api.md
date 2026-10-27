# Content API — Agent Guide

How an assistant posts to this site without a browser session, a repo checkout, or a
human in the loop. The routes live in [`convex/http.ts`](../convex/http.ts) and the
write logic in [`convex/contentApi.ts`](../convex/contentApi.ts); this document is the
operator's view of them — the exact request shapes, the response you get back, and the
mistakes worth not making twice.

Blog posts only. Projects, skills, uses, resume, and settings are **not** exposed by this
API and stay in `/admin`.

---

## 1. Before the first call

| Thing | Value |
| --- | --- |
| Base URL | `VITE_CONVEX_URL` — locally `https://api.ansyar-world.top`, routes at its **root** |
| Auth | `Authorization: Bearer <token>`, required on every route |
| Token | 64 hex chars in `.env.local` (gitignored). Only its SHA-256 digest is on the deployment |

The token must never be printed, logged, or committed. Configure it once with
`CONTENT_API_TOKEN_SHA256=<sha256 of the token>` on the Convex deployment — the
deployment never holds the token itself, so a leaked env dump yields nothing usable.
An unset or malformed digest fails closed: *every* content route answers `401`.

```bash
set -a; . ./.env.local; set +a          # keep the token in the environment only
BASE="${VITE_CONVEX_URL%/}"             # note: no /http segment before the path
```

> `https://api.ansyar-world.top/http/...` does not exist. HTTP routes sit at the bare
> origin (the same host the contact form posts to).

---

## 2. Routes

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/content/blog` | Create a post |
| `GET` | `/content/blog?status=&limit=` | List posts, newest first |
| `GET` | `/content/blog/:slug` | Read one post, drafts included |
| `PATCH` | `/content/blog/:slug` | Update only the fields you send |
| `POST` | `/content/blog/:slug/publish` | Publish (idempotent) |
| `POST` | `/content/blog/:slug/unpublish` | Back to draft (idempotent) |

All responses are `application/json` with `cache-control: no-store`. No CORS headers are
published: a browser is never a legitimate caller.

### Create — `POST /content/blog`

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Non-empty after trimming |
| `bodyMarkdown` | yes | Markdown source; non-empty after trimming |
| `slug` | no | Derived from the title when omitted |
| `excerpt` | no | Plain string |
| `coverImageUrl` | no | A URL string; there is no upload endpoint |
| `categorySlug` | no | Must already exist — see below |
| `tags` | no | Array of tag names/slugs; missing ones are created |
| `publish` | no | Defaults to `false`. **A new post is a draft** |

```bash
curl -sS -X POST "$BASE/content/blog" \
  -H "Authorization: Bearer $CONTENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Deploying Convex with Docker",
    "bodyMarkdown": "## Steps\n\nRun **deploy**, then check the logs.",
    "excerpt": "A short walkthrough of the self-hosted deploy.",
    "categorySlug": "devops",
    "tags": ["convex", "docker"]
  }'
# 201 → {"id":"…","slug":"deploying-convex-with-docker","status":"draft"}
```

`id` is the Convex document id, useful for finding the post in `/admin`. The slug is what
the public URL uses (`/blog/<slug>`).

A status of `draft` means the post is **invisible on the site**. Read it back, check it,
then publish.

### Read — `GET /content/blog/:slug`

Returns the whole stored document, drafts included, so you can verify what landed:

```bash
curl -sS "$BASE/content/blog/deploying-convex-with-docker" \
  -H "Authorization: Bearer $CONTENT_API_TOKEN"
# 200 → {"post":{ "_id":"…","_creationTime":…,"slug":"…","title":"…",
#                 "content":"<h2>Steps</h2><p>Run <strong>deploy</strong>…</p>",
#                 "tagIds":["…"],"status":"draft","readingTime":1 }}
```

`content` is the rendered HTML, not your markdown. It is the read path to trust when
checking that the body survived conversion. `publishedAt` appears only once the post has
been published; a draft has no such key. Note that the document reports `categoryId` and
`tagIds`, while every write path wants a **category slug** and tag **names** — read the
category list from `/admin` when you need one.

### List — `GET /content/blog?status=&limit=`

`status` is `draft` or `published`; omit it for both. `limit` is clamped to `1–50`
(default `20`). Returns a summary, not full posts:

```bash
curl -sS "$BASE/content/blog?status=draft&limit=5" -H "Authorization: Bearer $CONTENT_API_TOKEN"
# 200 → {"posts":[{"slug":"…","title":"…","status":"draft","publishedAt":null,"readingTime":1}]}
```

Use this for a collision check before choosing an explicit `slug`.

### Update — `PATCH /content/blog/:slug`

Send only what changes. Accepted keys: `title`, `excerpt`, `bodyMarkdown`,
`coverImageUrl`, `categorySlug`, `tags` — the same field names as create, minus `slug`
and `publish`.

```bash
curl -sS -X PATCH "$BASE/content/blog/deploying-convex-with-docker" \
  -H "Authorization: Bearer $CONTENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bodyMarkdown":"## Steps\n\nRun **deploy** twice, then check the logs."}'
# 200 → {"id":"…","slug":"…","status":"draft","updated":["content","readingTime"]}
```

`updated` names the stored columns that changed — a `bodyMarkdown` edit reports `content`
and `readingTime`, not `bodyMarkdown`. Use it to confirm an edit actually took.

Things that will surprise you:

- **Omitted is untouched.** Updating a headline does not clear tags, category, or cover.
- **`null` and `""` mean "not sent"** for `title`, `excerpt`, `coverImageUrl`, and
  `categorySlug`. There is no way to clear one of those fields through this API.
- **`tags: []` does clear tags** — an empty array is a value, unlike an empty string.
- **`bodyMarkdown: "   "` is an error, not an omission** (`400 body must not be empty`),
  because a blank body reads as a mistake rather than an edit.
- **Sending nothing updatable is a `400 no fields to update`.**
- **The slug cannot be renamed.** There is no redirect bookkeeping, so the slug is
  permanent; pick it deliberately on create.

### Publish / unpublish

```bash
curl -sS -X POST "$BASE/content/blog/deploying-convex-with-docker/publish" \
  -H "Authorization: Bearer $CONTENT_API_TOKEN"
# 200 → {"slug":"…","status":"published","publishedAt":1771…,"changed":true}
```

Both are idempotent. Repeating a publish on a published post returns
`changed: false` and writes nothing — no second audit row, no new `publishedAt`, and no
charge against the write budget. `publishedAt` is retained through an unpublish, so a
republished post keeps its original date. `POST` on a slug without `/publish` or
`/unpublish` is a `404`, not an update.

---

## 3. Errors

| Status | Message | Cause |
| --- | --- | --- |
| `400` | `title is required` / `bodyMarkdown is required` | Missing, blank, or wrong type on create |
| `400` | `invalid request body: expected a JSON object` | Body is not a JSON object |
| `400` | `slug must use lowercase letters, digits, dots, hyphens, or underscores, and start with a letter or digit` | Explicit slug that could not route |
| `400` | `slug required: the title has no characters a slug can use` | Title with no usable characters and no explicit slug |
| `400` | `category not found: <slug>` | `categorySlug` is not an existing category |
| `400` | `tag slug is empty: <raw>` | A tag that slugifies to nothing |
| `400` | `body must not be empty` | Empty or whitespace `bodyMarkdown` |
| `400` | `status must be draft or published` / `limit must be a number` | Bad query string |
| `401` | `unauthorized: a valid bearer token is required` | Missing, wrong, or unconfigured token |
| `404` | `post not found: <slug>` | Unknown slug, or the wrong slug entirely |
| `409` | `slug already in use: <slug>` | Slug taken — pick another, or `PATCH` the existing post |
| `413` | `request body exceeds 262144 bytes` | Body over the 256 KiB cap |
| `429` | `rate limit reached: 60 writes per hour. try again later` | Write budget exhausted |
| `500` | `unable to save the post` / `unable to publish the post` | Unexpected failure; safe to retry once |

Every error body is `{"error":"…"}`, and every `4xx` is a mistake in the request, not a
transient fault. A rejected request never costs rate-limit budget — but it also changes
nothing, so do not loop on a `400` or `409`.

## 4. Limits and side effects

- **60 accepted writes per hour, per token.** Metered after validation and before the
  write, so a tight retry loop cannot outrun it. This covers create, update, publish, and
  unpublish — and a no-op publish does not count.
- **256 KiB per request body**, checked before authentication.
- **Every write is logged** to the activity log as `agent@content-api` with the action
  (`create`, `update`, `publish`, `unpublish`) and the post's title. Your work is visibly
  attributed in `/admin`.
- **There is no delete route.** Deletion is deliberately a human action in `/admin`. If
  you create a throwaway post — a smoke test, a mistake — you cannot clean it up through
  the API; tell the owner the slug so they can remove it.

## 5. What the markdown becomes

- GFM: headings, lists, tables, code fences, strikethrough (stored as `<s>`).
- **Raw HTML is escaped, not rendered.** `<div>` in your markdown appears as literal
  text. There are no MDX components, no inline styles, no scripts.
- **Link and image destinations are allowlisted**: relative, fragment, protocol-relative,
  `http`, `https`, `mailto`. `javascript:` and `data:` destinations are dropped, leaving
  the element with an empty target.
- `readingTime` is computed on the stored HTML at 200 words per minute; you cannot set it.
- `coverImageUrl` is a plain URL string — host the image elsewhere (R2) and pass the URL.

## 6. The loop, end to end

1. `GET /content/blog?limit=50` — check the slug is free.
2. `POST /content/blog` with `bodyMarkdown` and no `publish` — lands as a draft.
3. `GET /content/blog/:slug` — read back `content` and confirm the conversion.
4. `PATCH /content/blog/:slug` — fix anything that read wrong.
5. `POST /content/blog/:slug/publish` — now it is live at `/blog/<slug>`.

Automation reminder: publishing is public and immediate. Draft, read back, and only
publish when the text is what the owner would sign their name to.

## See also

- [README.md § Content API](../README.md) — the same surface as a quick reference
- [`convex/lib/contentAuth.ts`](../convex/lib/contentAuth.ts) — token hashing, body cap, no-CORS response
- [`convex/lib/markdown.ts`](../convex/lib/markdown.ts) — markdown conversion and URL allowlist
