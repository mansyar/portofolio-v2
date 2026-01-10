import { createFileRoute } from '@tanstack/react-router'
import { ConvexClient } from 'convex/browser'
import { api } from '../../convex/_generated/api'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Route = createFileRoute('/sitemap.xml' as any)({
  server: {
    handlers: {
      GET: async () => {
        const convexUrl = process.env.VITE_CONVEX_URL || 'https://convex.ansyar-world.top'
        const client = new ConvexClient(convexUrl)
        
        const data = await client.query(api.sitemap.getSitemapData, {})
        const siteUrl = 'https://ansyar-world.top'
        
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${data.staticRoutes
    .map(
      (route: string) => `
  <url>
    <loc>${siteUrl}${route}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`
    )
    .join('')}
  ${data.projects
    .map(
      (slug: string) => `
  <url>
    <loc>${siteUrl}/projects/${slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join('')}
  ${data.blogPosts
    .map(
      (slug: string) => `
  <url>
    <loc>${siteUrl}/blog/${slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
    )
    .join('')}
</urlset>`

        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
          },
        })
      },
    },
  },
})
