interface UmamiScriptProps {
  url?: string;
  websiteId?: string;
}

export function UmamiScript({
  url = import.meta.env?.VITE_UMAMI_URL || (typeof process !== 'undefined' ? process.env.VITE_UMAMI_URL : ''),
  websiteId = import.meta.env?.VITE_UMAMI_WEBSITE_ID || (typeof process !== 'undefined' ? process.env.VITE_UMAMI_WEBSITE_ID : '')
}: UmamiScriptProps) {
  if (!url || !websiteId) {
    return null
  }
  
  // Ensure the URL doesn't have a trailing slash
  const baseUrl = url.replace(/\/$/, '')
  
  return (
    <script
      async
      defer
      src={`${baseUrl}/script.js`}
      data-website-id={websiteId}
      data-domains="ansyar-world.top,www.ansyar-world.top"
    />
  )
}
