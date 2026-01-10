import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProjectCard } from '../project-card'

describe('ProjectCard', () => {
  const mockProps = {
    title: 'Test Project',
    slug: 'test-project',
    shortDescription: 'This is a test project',
    techStack: ['React', 'TypeScript', 'Convex'],
  }

  it('renders project title and description', () => {
    render(<ProjectCard {...mockProps} />)
    
    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(screen.getByText('This is a test project')).toBeInTheDocument()
  })

  it('renders tech stack badges', () => {
    render(<ProjectCard {...mockProps} />)
    
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('Convex')).toBeInTheDocument()
  })

  it('contains link to project details', () => {
    render(<ProjectCard {...mockProps} />)
    // The title should be wrapped in a link
    const link = screen.getByRole('link', { name: 'Test Project' })
    expect(link).toBeInTheDocument()
  })
})
