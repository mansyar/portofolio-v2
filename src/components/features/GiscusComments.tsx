import { useEffect } from 'react';
import './GiscusComments.css';

interface GiscusCommentsProps {
  theme?: 'light' | 'dark';
}

export function GiscusComments({ theme = 'dark' }: GiscusCommentsProps) {
  useEffect(() => {
    const giscusTheme = theme === 'dark' ? 'dark' : 'light';
    const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
    
    if (iframe) {
      iframe.contentWindow?.postMessage(
        { giscus: { setConfig: { theme: giscusTheme } } },
        'https://giscus.app'
      );
    }
  }, [theme]);

  if (typeof window === 'undefined') return null;

  return (
    <div className="giscus-wrapper">
      <div className="giscus-header">
        <span className="giscus-header-dot red"></span>
        <span className="giscus-header-dot yellow"></span>
        <span className="giscus-header-dot green"></span>
        <span className="giscus-header-title">COMMENTS_CHANNEL</span>
      </div>
      <div className="giscus-content">
        <script
          src="https://giscus.app/client.js"
          data-repo="mansyar/portofolio-v2"
          data-repo-id="R_kgDOQ1Y0Jw"
          data-category="Announcements"
          data-category-id="DIC_kwDOQ1Y0J84C02s1"
          data-mapping="pathname"
          data-strict="0"
          data-reactions-enabled="1"
          data-emit-metadata="0"
          data-input-position="bottom"
          data-theme={theme === 'dark' ? 'dark' : 'light'}
          data-lang="en"
          data-loading="lazy"
          crossOrigin="anonymous"
          async
        />
        {/* Fallback container for Giscus */}
        <div className="giscus" />
      </div>
    </div>
  );
}
