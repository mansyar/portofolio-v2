import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

describe('UmamiScript', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('renders script tag when props are present', async () => {
    const { UmamiScript } = await import('../UmamiScript');
    render(
      <UmamiScript 
        url="https://analytics.test.com" 
        websiteId="test-id" 
      />
    );
    // React 19 hoists <script src="..."> to <head> automatically
    
    const script = document.head.querySelector('script[data-website-id="test-id"]');
    expect(script).toBeTruthy();
    expect(script?.getAttribute('data-website-id')).toBe('test-id');
    expect(script?.getAttribute('src')).toBe('https://analytics.test.com/script.js');
    expect(script?.getAttribute('data-domains')).toBe('ansyar-world.top,www.ansyar-world.top');
  });

  it('returns null when props/env are missing', async () => {
    const { UmamiScript } = await import('../UmamiScript');
    const { container } = render(<UmamiScript url="" websiteId="" />);
    expect(container.firstChild).toBeNull();
  });
});
