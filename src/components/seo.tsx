import { useLocation } from "@tanstack/react-router";

interface SeoProps {
  title: string;
  description: string;
  image?: string;
  type?: "website" | "article" | "profile";
  publishedTime?: string;
  author?: string;
  jsonLd?: Record<string, unknown>;
}

export function Seo({
  title,
  description,
  image,
  type = "website",
  publishedTime,
  author = "Ansyar",
  jsonLd,
}: SeoProps) {
  const location = useLocation();
  // Use environment variable for site URL or fallback
  const siteUrl = import.meta.env.VITE_APP_URL || "https://ansyar-world.top";
  const url = `${siteUrl}${location.pathname}`;
  const fullTitle = `${title} | Ansyar's Portfolio`;
  const defaultImage = `${siteUrl}/og-image.jpg`; // Fallback image
  const ogImage = image ? (image.startsWith("http") ? image : `${siteUrl}${image}`) : defaultImage;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <link rel="alternate" type="application/rss+xml" title="Ansyar's Dev Log" href="/feed.xml" />

      {/* Open Graph */}
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Ansyar's Portfolio" />
      <meta property="og:locale" content="en_US" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:creator" content="@ansyar" />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": type === "article" ? "BlogPosting" : "WebSite",
          url: url,
          name: fullTitle,
          description: description,
          author: {
            "@type": "Person",
            name: author,
          },
          image: ogImage,
          ...jsonLd,
        })}
      </script>
    </>
  );
}
