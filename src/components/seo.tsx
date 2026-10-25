import { useLocation } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface SiteSettings {
  siteTitle?: string;
  metaDescription?: string;
  defaultOgImage?: string;
  socialTwitter?: string;
  socialLinkedIn?: string;
  socialGitHub?: string;
}

interface SeoProps {
  title: string;
  description?: string;
  image?: string;
  type?: "website" | "article" | "profile";
  publishedTime?: string;
  author?: string;
  keywords?: string[];
  jsonLd?: Record<string, unknown>;
}

export function Seo({
  title,
  description,
  image,
  type = "website",
  publishedTime,
  author = "Muhammad Ansyar Rafi Putra",
  keywords,
  jsonLd,
}: SeoProps) {
  const rawSettings = useQuery(api.settings.getPublic);
  const settings = rawSettings as SiteSettings | undefined;
  const location = useLocation();

  // Use environment variable for site URL or fallback
  const siteUrl = import.meta.env.VITE_APP_URL || "https://ansyar-world.top";
  const url = `${siteUrl}${location.pathname}`;

  const siteName = settings?.siteTitle || "Muhammad Ansyar Rafi Putra | Portfolio";
  const fullTitle = `${title} | ${siteName}`;
  const metaDescription =
    description ||
    settings?.metaDescription ||
    "Portfolio of Muhammad Ansyar Rafi Putra — Full-Stack Developer and DevOps Engineer.";

  const defaultImage = settings?.defaultOgImage || `${siteUrl}/og-image.jpg`;
  const ogImage = image ? (image.startsWith("http") ? image : `${siteUrl}${image}`) : defaultImage;

  const twitterHandle = settings?.socialTwitter
    ? `@${settings.socialTwitter.replace("@", "")}`
    : "@ansyar";

  const defaultKeywords = [
    "Muhammad Ansyar Rafi Putra",
    "Ansyar",
    "Full-Stack Developer",
    "DevOps Engineer",
    "React Developer",
    "Portfolio",
  ];
  const allKeywords = keywords ? [...keywords, ...defaultKeywords] : defaultKeywords;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={allKeywords.join(", ")} />
      <meta name="author" content={author} />
      <link rel="canonical" href={url} />
      <link rel="alternate" type="application/rss+xml" title="Ansyar's Dev Log" href="/feed.xml" />

      {/* Open Graph */}
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:creator" content={twitterHandle} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": type === "article" ? "BlogPosting" : "WebSite",
          url: url,
          name: fullTitle,
          description: metaDescription,
          author: {
            "@type": "Person",
            name: author,
            url: siteUrl,
          },
          image: ogImage,
          ...jsonLd,
        })}
      </script>
    </>
  );
}
