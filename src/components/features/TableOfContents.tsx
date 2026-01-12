import { useEffect, useState, useMemo } from 'react';
import { List } from 'lucide-react';
import './TableOfContents.css';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  
  const headings = useMemo<Heading[]>(() => {
    if (typeof document === 'undefined') return [];
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headingElements = doc.querySelectorAll('h2, h3');
    
    return Array.from(headingElements).map((el) => {
      const text = el.textContent || '';
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      
      return {
        id,
        text,
        level: parseInt(el.tagName.replace('H', ''), 10),
      };
    });
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '0% 0% -80% 0%' }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="toc-container">
      <div className="toc-header">
        <List size={14} className="text-(--color-ubuntu-orange)" />
        <span className="toc-title">TABLE_OF_CONTENTS</span>
      </div>
      <ul className="toc-list">
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={`toc-item level-${heading.level} ${
              activeId === heading.id ? 'active' : ''
            }`}
          >
            <a
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(heading.id)?.scrollIntoView({
                  behavior: 'smooth',
                });
                setActiveId(heading.id);
              }}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
      <div className="toc-footer">
        <span className="toc-footer-dot"></span>
        <span className="toc-footer-text">Transmission Index</span>
      </div>
    </nav>
  );
}
