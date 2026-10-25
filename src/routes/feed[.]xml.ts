import { createFileRoute } from "@tanstack/react-router";
import { ConvexClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

// biome-ignore lint/suspicious/noExplicitAny: the route path is generated at runtime, so it is not part of the typed route union
export const Route = createFileRoute("/feed.xml" as any)({
  server: {
    handlers: {
      GET: async () => {
        const convexUrl = process.env.VITE_CONVEX_URL || "https://convex.ansyar-world.top";
        const client = new ConvexClient(convexUrl);

        const posts = await client.query(api.blog.listForRss, {});
        const siteUrl = "https://ansyar-world.top";
        const now = new Date().toUTCString();

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Muhammad Ansyar Rafi Putra - Dev Log</title>
    <description>Technical blog posts by Muhammad Ansyar Rafi Putra about DevOps, web development, and software engineering</description>
    <link>${siteUrl}/blog</link>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    ${posts
      .map(
        (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.excerpt || ""}]]></description>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <pubDate>${post.publishedAt ? new Date(post.publishedAt).toUTCString() : ""}</pubDate>
    </item>`
      )
      .join("")}
  </channel>
</rss>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
          },
        });
      },
    },
  },
});
