import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BlogCard } from '../blog-card'

describe('BlogCard', () => {
  const mockProps = {
    title: 'Test Blog Post',
    slug: 'test-blog-post',
    excerpt: 'This is a test blog excerpt',
    publishedAt: 1736410000000, // Fixed timestamp
    readingTime: 5,
  }

  it('renders blog post title and excerpt', () => {
    render(<BlogCard {...mockProps} />)
    
    expect(screen.getByText('Test Blog Post')).toBeInTheDocument()
    expect(screen.getByText('This is a test blog excerpt')).toBeInTheDocument()
  })

  it('renders reading time', () => {
    render(<BlogCard {...mockProps} />)
    expect(screen.getByText(/5 min read/i)).toBeInTheDocument()
  })

  it('renders formatted date', () => {
    render(<BlogCard {...mockProps} />)
    // Date formatting might depend on locale, but checking for presence of parts of date
    // 1736410000000 is around Jan 2025
    expect(screen.getByText(/2025/)).toBeInTheDocument()
  })
})
