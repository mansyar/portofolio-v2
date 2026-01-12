import { Share2, Twitter, Linkedin, Link as LinkIcon, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import './ShareButtons.css';

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('URL_COPIED_TO_CLIPBOARD');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('FAILED_TO_COPY_URL');
    }
  };

  return (
    <div className="share-buttons">
      <div className="share-label">
        <Share2 size={14} />
        <span>SHARE_TRANSMISSION</span>
      </div>
      <div className="share-list">
        <a
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="share-button twitter"
          title="Share on Twitter"
        >
          <Twitter size={18} />
        </a>
        <a
          href={shareLinks.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="share-button linkedin"
          title="Share on LinkedIn"
        >
          <Linkedin size={18} />
        </a>
        <button
          onClick={copyToClipboard}
          className={`share-button copy ${copied ? 'copied' : ''}`}
          title="Copy Link"
        >
          {copied ? <Check size={18} /> : <LinkIcon size={18} />}
        </button>
      </div>
    </div>
  );
}
