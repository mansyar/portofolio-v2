/**
 * Adds unique IDs to h2 and h3 headings in HTML content
 * This enables Table of Contents linking
 */
export function addHeadingIds(html: string): string {
  if (typeof document === 'undefined') return html;
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const headings = doc.querySelectorAll('h2, h3');
  
  headings.forEach((heading) => {
    const text = heading.textContent || '';
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    
    heading.setAttribute('id', id);
  });
  
  return doc.body.innerHTML;
}
