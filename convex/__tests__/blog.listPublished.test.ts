// @vitest-environment edge-runtime
import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import { api } from "../_generated/api";
import schema from "../schema";

// `convex-test` loads a function's module out of this map, so every Convex
// module has to be listed. The `_generated` directory is what lets the library
// work out the module root; the test files are excluded so they are not
// mistaken for Convex modules.
const modules = import.meta.glob(["../**/*.ts", "!../__tests__/**"]);

const BASE_TIME = 1_700_000_000_000;

type PostFixture = {
  slug: string;
  status: "draft" | "published";
  publishedAt?: number;
  categorySlug?: string;
  tagSlugs?: string[];
};

/** Seeds categories, tags, and posts. Returns nothing: `t.run` values must be
 * Convex-serialisable, and no assertion needs the generated ids. */
async function seed(t: ReturnType<typeof convexTest>, posts: PostFixture[]): Promise<void> {
  await t.run(async (ctx) => {
    const categoryIds = new Map<string, Awaited<ReturnType<typeof ctx.db.insert>>>();

    for (const post of posts) {
      if (post.categorySlug && !categoryIds.has(post.categorySlug)) {
        const id = await ctx.db.insert("blogCategories", {
          name: post.categorySlug,
          slug: post.categorySlug,
          displayOrder: categoryIds.size,
        });
        categoryIds.set(post.categorySlug, id);
      }
    }

    const tagIds = new Map<string, Awaited<ReturnType<typeof ctx.db.insert>>>();
    for (const post of posts) {
      for (const slug of post.tagSlugs ?? []) {
        if (tagIds.has(slug)) continue;
        const id = await ctx.db.insert("blogTags", { name: slug, slug });
        tagIds.set(slug, id);
      }
    }

    for (const post of posts) {
      await ctx.db.insert("blogPosts", {
        slug: post.slug,
        title: post.slug,
        content: "body",
        status: post.status,
        tagIds: (post.tagSlugs ?? []).map((slug) => {
          const id = tagIds.get(slug);
          if (id === undefined) throw new Error(`seed: unknown tag ${slug}`);
          return id;
        }),
        categoryId: post.categorySlug ? categoryIds.get(post.categorySlug) : undefined,
        publishedAt: post.publishedAt,
      });
    }
  });
}

describe("blog.listPublished", () => {
  it("returns one page of published posts ordered newest first with the real total", async () => {
    const t = convexTest(schema, modules);
    await seed(
      t,
      Array.from({ length: 12 }, (_, index) => ({
        slug: `post-${index + 1}`,
        status: "published" as const,
        publishedAt: BASE_TIME + index * 1000,
      }))
    );
    await seed(t, [{ slug: "unpublished", status: "draft" }]);

    const first = await t.query(api.blog.listPublished, { page: 1, pageSize: 5 });
    expect(first.posts.map((post) => post.slug)).toEqual([
      "post-12",
      "post-11",
      "post-10",
      "post-9",
      "post-8",
    ]);
    expect(first.total).toBe(12);
    expect(first.totalPages).toBe(3);

    const last = await t.query(api.blog.listPublished, { page: 3, pageSize: 5 });
    expect(last.posts.map((post) => post.slug)).toEqual(["post-2", "post-1"]);
  });

  it("filters by tag membership, not by slug text", async () => {
    const t = convexTest(schema, modules);
    await seed(t, [
      // Tagged, but its slug says nothing about the tag.
      { slug: "shipping-fast", status: "published", publishedAt: BASE_TIME, tagSlugs: ["react"] },
      // Untagged, but its slug contains the tag's text.
      { slug: "reactive-ui", status: "published", publishedAt: BASE_TIME + 1000 },
      {
        slug: "docker-notes",
        status: "published",
        publishedAt: BASE_TIME + 2000,
        tagSlugs: ["docker"],
      },
    ]);

    const result = await t.query(api.blog.listPublished, { tagSlug: "react" });

    expect(result.posts.map((post) => post.slug)).toEqual(["shipping-fast"]);
    expect(result.total).toBe(1);
  });

  it("filters by category id, not by slug text", async () => {
    const t = convexTest(schema, modules);
    await seed(t, [
      // Carries the devops category although its slug never mentions devops.
      {
        slug: "shipping-fast",
        status: "published",
        publishedAt: BASE_TIME,
        categorySlug: "devops",
      },
      // Its slug contains "devops" but it belongs to another category.
      {
        slug: "devops-notes",
        status: "published",
        publishedAt: BASE_TIME + 1000,
        categorySlug: "writing",
      },
    ]);

    const result = await t.query(api.blog.listPublished, { categorySlug: "devops" });

    expect(result.posts.map((post) => post.slug)).toEqual(["shipping-fast"]);
    expect(result.total).toBe(1);
  });

  it("returns an empty page for an unknown category or tag slug", async () => {
    const t = convexTest(schema, modules);
    await seed(t, [{ slug: "post-1", status: "published", publishedAt: BASE_TIME }]);

    const unknownCategory = await t.query(api.blog.listPublished, { categorySlug: "nope" });
    expect(unknownCategory).toEqual({ posts: [], total: 0, totalPages: 0 });

    const unknownTag = await t.query(api.blog.listPublished, { tagSlug: "nope" });
    expect(unknownTag).toEqual({ posts: [], total: 0, totalPages: 0 });
  });

  it("clamps a page past the end to an empty page while keeping the real total", async () => {
    const t = convexTest(schema, modules);
    await seed(t, [
      { slug: "post-1", status: "published", publishedAt: BASE_TIME },
      { slug: "post-2", status: "published", publishedAt: BASE_TIME + 1000 },
    ]);

    const result = await t.query(api.blog.listPublished, { page: 99, pageSize: 5 });

    expect(result.posts).toEqual([]);
    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(1);
  });

  it("excludes drafts and published posts dated in the future", async () => {
    const t = convexTest(schema, modules);
    await seed(t, [
      { slug: "live", status: "published", publishedAt: BASE_TIME },
      { slug: "draft", status: "draft" },
      {
        slug: "scheduled",
        status: "published",
        publishedAt: Date.now() + 60 * 60 * 1000,
      },
    ]);

    const result = await t.query(api.blog.listPublished, { pageSize: 10 });

    expect(result.posts.map((post) => post.slug)).toEqual(["live"]);
    expect(result.total).toBe(1);
  });
});
