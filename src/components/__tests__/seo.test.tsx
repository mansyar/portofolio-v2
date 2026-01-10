import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Seo } from '../seo'

// Seo uses useLocation from @tanstack/react-router which we mocked in vitest.setup.tsx

describe('Seo Component', () => {
  it('renders correctly without crashing', () => {
    // We can't easily test <title> or <meta> tags in jsdom easily if they are outside the container
    // unless we use document.title etc.
    render(<Seo title="Test Title" description="Test Description" />)
    
    expect(document.title).toContain('Test Title')
  })

  it('generates JSON-LD script tag', () => {
    const { container } = render(<Seo title="Test Title" description="Test Description" />)
    const scriptTag = container.querySelector('script[type="application/ld+json"]')
    
    expect(scriptTag).toBeInTheDocument()
    const content = JSON.parse(scriptTag?.textContent || '{}')
    expect(content.name).toContain('Test Title')
    expect(content.description).toBe('Test Description')
  })
})
